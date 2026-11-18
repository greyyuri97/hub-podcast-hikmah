/**
 * API contract tests for google-apps-script/Code.gs (via tests/gas-emulator.cjs).
 *   node tests/gas-api.test.cjs
 */
const assert = require('node:assert/strict');
const { startServer } = require('./gas-emulator.cjs');

const PORT = 8799;
const URL_ = `http://localhost:${PORT}/exec`;
const PIN = '246810';

const get = async () => (await fetch(`${URL_}?action=getAll`)).json();
const post = async (body) =>
  (await fetch(URL_, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })).json();
const ok = (r) => { assert.equal(r.ok, true, `expected ok, got: ${r.error}`); return r.data; };
const err = (r, re) => { assert.equal(r.ok, false, 'expected an error'); assert.match(r.error, re); };

let passed = 0;
const test = async (name, fn) => { await fn(); passed++; console.log('  ✓', name); };

(async () => {
  const { server, rt } = await startServer(PORT);
  try {
    await test('getAll returns all 7 sheets, no hidden columns', async () => {
      const d = ok(await get());
      assert.deepEqual(Object.keys(d).sort(), ['CADANGAN', 'KITAB', 'PANDUAN', 'PANEL', 'PERINGATAN', 'UPCOMING', 'YOUTUBE']);
      assert.ok(d.UPCOMING.length >= 1 && d.UPCOMING[0].hari, 'seed row has hari');
      assert.equal(typeof d.KITAB[0].bilangan, 'number');
      assert.equal(typeof d.UPCOMING[0].order, 'number');
    });

    await test('preflight (OPTIONS) is rejected like real Apps Script', async () => {
      const r = await fetch(URL_, { method: 'OPTIONS' });
      assert.equal(r.status, 405);
    });

    await test('verifyPin: right PIN ok, wrong PIN rejected', async () => {
      ok(await post({ action: 'verifyPin', pin: PIN }));
      err(await post({ action: 'verifyPin', pin: '000000' }), /PIN salah/);
      rt.cache.clear();
    });

    await test('public cannot write admin sheets', async () => {
      for (const sheet of ['UPCOMING', 'PANEL', 'PANDUAN', 'PERINGATAN', 'KITAB', 'YOUTUBE']) {
        err(await post({ action: 'create', sheet, item: { tajuk: 'x' } }), /admin/);
      }
      const id = ok(await get()).KITAB[0].id;
      err(await post({ action: 'increment', sheet: 'KITAB', id, delta: 1 }), /admin/);
      err(await post({ action: 'delete', sheet: 'KITAB', id }), /admin/);
      err(await post({ action: 'reorder', sheet: 'UPCOMING', ids: [] }), /admin/);
    });

    let cad;
    await test('public creates CADANGAN; server forces status/reply, hides owner_hash', async () => {
      cad = ok(await post({
        action: 'create', sheet: 'CADANGAN', ownerKey: 'k-owner-1',
        item: { tarikh: '2026-11-18', catatan: '  Cadangan ujian  ', status: 'SELESAI', balasan_admin: 'hack' },
      }));
      assert.equal(cad.status, 'BELUM');
      assert.equal(cad.balasan_admin, '');
      assert.equal(cad.catatan, 'Cadangan ujian');
      assert.equal(cad.owner_hash, undefined);
      const row = ok(await get()).CADANGAN.find((r) => r.id === cad.id);
      assert.ok(row && row.owner_hash === undefined);
    });

    await test('public edit: owner ok (only tarikh/catatan), stranger rejected', async () => {
      const u = ok(await post({ action: 'update', sheet: 'CADANGAN', id: cad.id, ownerKey: 'k-owner-1', patch: { catatan: 'Disunting', status: 'SELESAI', balasan_admin: 'x' } }));
      assert.equal(u.catatan, 'Disunting');
      assert.equal(u.status, 'BELUM');
      assert.equal(u.balasan_admin, '');
      err(await post({ action: 'update', sheet: 'CADANGAN', id: cad.id, ownerKey: 'k-other', patch: { catatan: 'x' } }), /sendiri/);
      err(await post({ action: 'update', sheet: 'CADANGAN', id: cad.id, patch: { catatan: 'x' } }), /sendiri/);
    });

    await test('admin marks Done + replies; owner is then locked out', async () => {
      const u = ok(await post({ action: 'update', sheet: 'CADANGAN', id: cad.id, pin: PIN, patch: { status: 'SELESAI', balasan_admin: 'Terima kasih' } }));
      assert.equal(u.status, 'SELESAI');
      assert.equal(u.balasan_admin, 'Terima kasih');
      err(await post({ action: 'update', sheet: 'CADANGAN', id: cad.id, ownerKey: 'k-owner-1', patch: { catatan: 'x' } }), /dikunci/);
      const back = ok(await post({ action: 'update', sheet: 'CADANGAN', id: cad.id, pin: PIN, patch: { status: 'whatever' } }));
      assert.equal(back.status, 'BELUM', 'invalid status normalised');
    });

    await test('CADANGAN validation: empty / too long', async () => {
      err(await post({ action: 'create', sheet: 'CADANGAN', item: { catatan: '   ' } }), /diperlukan/);
      err(await post({ action: 'create', sheet: 'CADANGAN', item: { catatan: 'a'.repeat(1001) } }), /panjang/);
    });

    await test('formula injection is neutralised', async () => {
      const r = ok(await post({ action: 'create', sheet: 'CADANGAN', item: { catatan: '=IMPORTXML("http://x")' } }));
      const sheet = rt.sheets.get('CADANGAN');
      const raw = sheet.data.find((row) => row[0] === r.id);
      // emulator consumes the apostrophe exactly like Sheets; the cell holds literal text
      assert.equal(raw[2], '=IMPORTXML("http://x")');
      assert.equal(r.catatan, '=IMPORTXML("http://x")');
    });

    let up;
    await test('admin CRUD + auto order on UPCOMING', async () => {
      const before = ok(await get()).UPCOMING;
      up = ok(await post({ action: 'create', sheet: 'UPCOMING', pin: PIN, item: { tarikh: '2026-12-03', hari: 'Khamis', tajuk: 'Ujian', panel: 'A & B' } }));
      assert.equal(up.order, Math.max(...before.map((r) => r.order)) + 1);
      const e = ok(await post({ action: 'update', sheet: 'UPCOMING', id: up.id, pin: PIN, patch: { tajuk: 'Ujian 2', id: 'hijack' } }));
      assert.equal(e.tajuk, 'Ujian 2');
      assert.equal(e.id, up.id, 'id cannot be changed');
    });

    await test('reorder rewrites order 1..n', async () => {
      const rows = ok(await get()).UPCOMING;
      const ids = rows.map((r) => r.id).reverse();
      ok(await post({ action: 'reorder', sheet: 'UPCOMING', pin: PIN, ids }));
      const after = ok(await get()).UPCOMING;
      ids.forEach((id, i) => assert.equal(after.find((r) => r.id === id).order, i + 1));
      err(await post({ action: 'reorder', sheet: 'KITAB', pin: PIN, ids: [] }), /order/);
    });

    await test('KITAB increment is atomic-ish & clamps at 0', async () => {
      const k = ok(await post({ action: 'create', sheet: 'KITAB', pin: PIN, item: { nama_kitab: 'Uji', bilangan: '2' } }));
      assert.equal(k.bilangan, 2);
      await Promise.all([1, 1, 1].map((d) => post({ action: 'increment', sheet: 'KITAB', id: k.id, pin: PIN, delta: d })));
      assert.equal(ok(await get()).KITAB.find((r) => r.id === k.id).bilangan, 5);
      const z = ok(await post({ action: 'increment', sheet: 'KITAB', id: k.id, pin: PIN, delta: -99 }));
      assert.equal(z.bilangan, 0);
      err(await post({ action: 'increment', sheet: 'PANEL', id: k.id, pin: PIN, delta: 1 }), /KITAB/);
    });

    await test('delete + missing record + bad sheet/action', async () => {
      ok(await post({ action: 'delete', sheet: 'UPCOMING', id: up.id, pin: PIN }));
      assert.ok(!ok(await get()).UPCOMING.some((r) => r.id === up.id));
      err(await post({ action: 'delete', sheet: 'UPCOMING', id: up.id, pin: PIN }), /tidak dijumpai/);
      err(await post({ action: 'create', sheet: 'NOPE', pin: PIN, item: {} }), /Sheet tidak sah/);
      err(await post({ action: 'explode', sheet: 'PANEL', pin: PIN }), /tidak dikenali/);
      const bad = await (await fetch(URL_, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{not json' })).json();
      assert.equal(bad.ok, false);
    });

    await test('Date & time cells typed manually into the Sheet are normalised', async () => {
      // Dates must come from the script's own realm (as real Sheets values do) for instanceof Date.
      const D = (...a) => require('node:vm').runInContext(`new Date(${a.join(',')})`, rt.gs);
      const sh = rt.sheets.get('PANEL');
      sh.data.push(['manual1', 'Tajuk manual', 'Panel manual', D(2026, 11, 25)]);
      const u = rt.sheets.get('UPCOMING');
      u.data.push(['manual2', 9, '', D(2026, 11, 26), D(1899, 11, 30, 21, 0), 'T', 'P']);
      u.data.push(['', '', '', '', '', '', '']); // blank row is skipped
      const d = ok(await get());
      assert.equal(d.PANEL.find((r) => r.id === 'manual1').tarikh, '2026-12-25');
      const m = d.UPCOMING.find((r) => r.id === 'manual2');
      assert.equal(m.tarikh, '2026-12-26');
      assert.equal(m.masa, '21:00');
    });

    await test('PIN brute-force guard locks after 10 failures', async () => {
      rt.cache.clear();
      for (let i = 0; i < 10; i++) err(await post({ action: 'verifyPin', pin: 'x' + i }), /PIN salah/);
      err(await post({ action: 'verifyPin', pin: PIN }), /Terlalu banyak/);
      rt.cache.clear();
    });

    await test('global anti-spam ceiling on public CADANGAN', async () => {
      rt.cache.clear();
      let blocked = 0;
      for (let i = 0; i < 32; i++) {
        const r = await post({ action: 'create', sheet: 'CADANGAN', item: { catatan: 'spam ' + i } });
        if (!r.ok) blocked++;
      }
      assert.equal(blocked, 2);
      rt.cache.clear();
    });

    console.log(`\n${passed} API tests passed`);
  } finally {
    server.close();
  }
})().catch((e) => { console.error('\n✗', e.message); process.exit(1); });
