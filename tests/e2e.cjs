/**
 * End-to-end test: real built app (LIVE mode) <-> real Code.gs (emulated) via Playwright.
 *   npm run test:e2e
 * Builds the app with VITE_GAS_URL pointing at the emulator, then drives every section
 * as a public user and as admin, asserting UI + spreadsheet state + zero console errors.
 */
const { createRequire } = require('node:module');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { startServer } = require('./gas-emulator.cjs');

const req = createRequire(__filename);
let playwright;
try { playwright = req('playwright'); } catch { playwright = require(path.join(require('node:child_process').execSync('npm root -g').toString().trim(), 'playwright')); }
const { chromium, devices } = playwright;

const ROOT = path.join(__dirname, '..');
const GAS_PORT = 8787;
const APP_PORT = 4180;
const PIN = '246810';
const APP = `http://localhost:${APP_PORT}/`;
const DIST = path.join(ROOT, process.argv[2] || '.e2e-dist');

// ---------------- tiny static server for the built app ----------------
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
function serveDist() {
  return new Promise((resolve) => {
    const s = http.createServer((rq, rs) => {
      let p = decodeURIComponent(new URL(rq.url, APP).pathname);
      if (p.endsWith('/')) p += 'index.html';
      const f = path.join(DIST, p);
      if (!f.startsWith(DIST) || !fs.existsSync(f)) { rs.writeHead(404); return rs.end(); }
      rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(rs);
    });
    s.listen(APP_PORT, () => resolve(s));
  });
}

// ---------------- helpers ----------------
let passed = 0;
const step = async (name, fn) => { await fn(); passed++; console.log('  ✓', name); };
const errors = [];
let expectNetErrors = false; // set during deliberate offline tests

function watch(page, label) {
  page.on('pageerror', (e) => errors.push(`[${label}] pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    if (expectNetErrors) return;
    errors.push(`[${label}] console: ${m.text()}`);
  });
}

const THUMB = fs.readFileSync(path.join(ROOT, 'public/icons/icon-512.png'));
async function stubThumbs(ctx) {
  // The sandbox network blocks i.ytimg.com; serve a real 512px PNG so the real-thumbnail path is exercised.
  await ctx.route('**/i.ytimg.com/**', (r) => r.fulfill({ status: 200, contentType: 'image/png', body: THUMB }));
}

const sheet = (rt, name) => {
  const [h, ...rows] = rt.sheets.get(name).data;
  return rows.filter((r) => r[0]).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i]])));
};
const synced = (page) => page.waitForFunction(() => !document.querySelector('.animate-spin'), null, { timeout: 15000 });
const toast = (page, re) => page.getByRole('status').filter({ hasText: re }).first().waitFor({ timeout: 8000 });

async function adminLogin(page, pin = PIN) {
  for (let i = 0; i < 5; i++) await page.click('button[aria-label="Hak cipta"]');
  await page.fill('input[aria-label="PIN Admin"]', pin);
  await page.click('text=Buka Kunci');
}
const go = async (page, tab) => {
  await page.evaluate((t) => { location.hash = t; }, tab);
  await page.waitForSelector(`#h-${tab}`);
};

async function noHorizontalScroll(page, label) {
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  assert.ok(sw <= iw, `${label}: horizontal overflow ${sw} > ${iw}`);
}

// ======================================================================
(async () => {
  const { server: gas, rt } = await startServer(GAS_PORT, { pin: PIN });
  const app = await serveDist();
  const browser = await chromium.launch();

  try {
    // ------------------------------ PUBLIC ------------------------------
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, permissions: ['clipboard-read', 'clipboard-write'] });
    await stubThumbs(ctx);
    const page = await ctx.newPage();
    watch(page, 'public');

    await step('live load: data comes from Code.gs', async () => {
      await page.goto(APP + '#upcoming');
      await synced(page);
      await page.getByRole('heading', { level: 1 }).filter({ hasText: 'Mengurus Hati' }).waitFor();
      assert.equal(await page.locator('text=Demo').count(), 0, 'should not be in demo mode');
    });

    await step('Upcoming: Salin Info WA copies formatted message', async () => {
      await page.getByRole('button', { name: 'Salin Info WA' }).first().click();
      await toast(page, /disalin/i);
      const clip = await page.evaluate(() => navigator.clipboard.readText());
      assert.match(clip, /\*Tajuk:\* Mengurus Hati/);
      assert.match(clip, /\*Hari\/Tarikh:\* \w+, \d+ \w+ \d{4}/);
      assert.match(clip, new RegExp(`${APP_PORT}/#panduan`));
    });

    await step('Hero "Panduan Panel" navigates to Panduan', async () => {
      await page.click('button:has-text("Panduan Panel")');
      await page.waitForSelector('#h-panduan');
      assert.equal(new URL(page.url()).hash, '#panduan');
      assert.ok(await page.locator('a:has-text("Muat Turun PDF")').count() >= 1);
      // skrip promosi rows must NOT leak into Panduan Panel
      assert.equal(await page.locator('#h-panduan >> xpath=ancestor::section').locator('text=Contoh Skrip Promosi').count(), 0);
    });

    await step('List Panel: search + filter + empty state', async () => {
      await go(page, 'panel');
      await page.fill('input[placeholder^="Cari"]', 'hafiz');
      assert.equal(await page.locator('section li').count(), 1);
      await page.fill('input[placeholder^="Cari"]', 'zzzz');
      await page.waitForSelector('text=Tiada padanan');
      await page.click('button[aria-label="Kosongkan carian"]');
      await page.click('role=tab[name="Lepas"]');
      await page.click('role=tab[name="Semua"]');
      assert.ok(await page.locator('section li').count() >= 1);
    });

    await step('Peringatan: speech bubble + Arabic RTL rendered', async () => {
      await go(page, 'peringatan');
      const ar = page.locator('p[lang="ar"]').first();
      assert.equal(await ar.getAttribute('dir'), 'rtl');
    });

    await step('Promosi Kitab: public sees counts, no +/- controls, script card', async () => {
      await go(page, 'kitab');
      assert.ok(await page.locator('[aria-label$="kali dipromosi"]').count() >= 1);
      assert.equal(await page.locator('button[aria-label^="Tambah Riyadhus"]').count(), 0);
      await page.waitForSelector('text=Contoh Skrip Promosi');
    });

    await step('Episode YT: placeholder id shows fallback (no 404 request)', async () => {
      await go(page, 'youtube');
      const a = page.locator('section li a').first();
      assert.equal(await a.getAttribute('href'), 'https://www.youtube.com/watch?v=CONTOHEP001');
      assert.equal(await a.getAttribute('target'), '_blank');
      assert.equal(await page.locator('section li img').count(), 0);
    });

    let myId;
    await step('Cadangan: public submit -> saved with owner_hash', async () => {
      await go(page, 'cadangan');
      await page.fill('#cad-catatan', 'Cadangan E2E: tambah sari kata BM pada semua episod.');
      await page.click('text=Hantar Cadangan');
      await toast(page, /Terima kasih/);
      await synced(page);
      const row = sheet(rt, 'CADANGAN').find((r) => r.catatan.startsWith('Cadangan E2E'));
      assert.ok(row, 'row in sheet');
      assert.equal(row.status, 'BELUM');
      assert.match(row.owner_hash, /^[0-9a-f]{64}$/);
      myId = row.id;
      await page.locator('li', { hasText: 'Cadangan E2E' }).locator('text=Cadangan anda').waitFor();
    });

    await step('Cadangan: cooldown blocks immediate resubmit', async () => {
      await page.fill('#cad-catatan', 'Spam kedua yang terlalu cepat');
      await page.click('text=Hantar Cadangan');
      await toast(page, /Sila tunggu/);
      assert.equal(sheet(rt, 'CADANGAN').filter((r) => r.catatan.startsWith('Spam kedua')).length, 0);
      await page.fill('#cad-catatan', '');
    });

    await step('Cadangan: owner edits own; cannot edit others', async () => {
      const mine = page.locator('li', { hasText: 'Cadangan E2E' });
      await mine.locator('button[aria-label="Edit cadangan"]').click();
      await page.fill('#f-catatan', 'Cadangan E2E (disunting): sari kata BM & EN.');
      await page.click('button:has-text("Simpan")');
      await toast(page, /disimpan/);
      await synced(page);
      assert.match(sheet(rt, 'CADANGAN').find((r) => r.id === myId).catatan, /disunting/);
      const other = page.locator('li', { hasText: 'soal jawab' });
      if (await other.count()) assert.equal(await other.locator('button[aria-label="Edit cadangan"]').count(), 0);
      // admin-only controls hidden
      assert.equal(await page.locator('button[aria-label="Padam cadangan"]').count(), 0);
      assert.equal(await page.locator('textarea[aria-label="Maklum balas admin"]').count(), 0);
    });

    await step('Cadangan: status filter counts', async () => {
      await page.click('role=tab[name=/Belum Selesai/]');
      assert.ok(await page.locator('text=Cadangan E2E').count());
      await page.click('role=tab[name=/^Selesai/]');
      assert.equal(await page.locator('text=Cadangan E2E').count(), 0);
      await page.click('role=tab[name=/^Semua/]');
    });

    // ------------------------------ ADMIN ------------------------------
    await step('Admin: wrong PIN rejected, right PIN unlocks', async () => {
      await adminLogin(page, '000000');
      await page.waitForSelector('text=PIN tidak sah');
      await page.fill('input[aria-label="PIN Admin"]', PIN);
      await page.click('text=Buka Kunci');
      await page.waitForSelector('button[title="Keluar Mod Admin"]');
      rt.cache.clear(); // reset brute-force counter
    });

    await step('Admin Upcoming: add (hari auto) / edit / reorder / delete', async () => {
      await go(page, 'upcoming');
      await page.click('text=Tambah Slot');
      await page.fill('#f-tarikh', '2026-12-31');
      assert.equal(await page.inputValue('#f-hari'), 'Khamis');
      await page.fill('#f-tajuk', 'E2E Slot Tahun Baru');
      await page.fill('#f-panel', 'Panel E2E');
      await page.click('button:has-text("Simpan")');
      await toast(page, /ditambah/);
      await synced(page);
      let row = sheet(rt, 'UPCOMING').find((r) => r.tajuk === 'E2E Slot Tahun Baru');
      assert.ok(row && row.hari === 'Khamis' && row.tarikh === '2026-12-31');

      const card = () => page.locator('li', { hasText: 'E2E Slot' });
      await card().locator('button[aria-label="Edit"]').click();
      await page.fill('#f-tajuk', 'E2E Slot Diedit');
      await page.click('button:has-text("Simpan")');
      await toast(page, /disimpan/);
      await synced(page);
      assert.ok(sheet(rt, 'UPCOMING').find((r) => r.tajuk === 'E2E Slot Diedit'));

      const before = Number(sheet(rt, 'UPCOMING').find((r) => r.tajuk === 'E2E Slot Diedit').order);
      await card().locator('button[aria-label="Naik"]').click();
      await synced(page);
      await page.waitForTimeout(300);
      const after = Number(sheet(rt, 'UPCOMING').find((r) => r.tajuk === 'E2E Slot Diedit').order);
      assert.ok(after < before, `order moved up (${before} -> ${after})`);

      await card().locator('button[aria-label="Padam"]').click();
      await page.click('div[role="dialog"] button:has-text("Padam")');
      await toast(page, /dipadam/);
      await synced(page);
      assert.ok(!sheet(rt, 'UPCOMING').some((r) => r.tajuk.startsWith('E2E Slot')));
    });

    await step('Admin List Panel: add / edit / delete', async () => {
      await go(page, 'panel');
      await page.click('text=Tambah Panel');
      await page.fill('#f-tajuk', 'Tajuk E2E');
      await page.fill('#f-nama_panel', 'Ustaz E2E');
      await page.click('button:has-text("Simpan")');
      await toast(page, /ditambah/);
      await synced(page);
      assert.ok(sheet(rt, 'PANEL').find((r) => r.nama_panel === 'Ustaz E2E'));
      await page.locator('li', { hasText: 'Ustaz E2E' }).locator('button[aria-label="Padam"]').click();
      await page.click('div[role="dialog"] button:has-text("Padam")');
      await synced(page);
      await page.waitForTimeout(200);
      assert.ok(!sheet(rt, 'PANEL').find((r) => r.nama_panel === 'Ustaz E2E'));
    });

    await step('Admin Panduan: add doc -> GDrive download link conversion', async () => {
      await go(page, 'panduan');
      await page.click('text=Tambah Dokumen');
      await page.fill('#f-tajuk', 'Dokumen E2E');
      await page.fill('#f-gdrive_url', 'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQ/view?usp=sharing');
      await page.click('button:has-text("Simpan")');
      await toast(page, /ditambah/);
      await synced(page);
      const row = sheet(rt, 'PANDUAN').find((r) => r.tajuk === 'Dokumen E2E');
      assert.equal(row.kategori, 'PANEL');
      const href = await page.locator('article', { hasText: 'Dokumen E2E' }).locator('a:has-text("Muat Turun PDF")').getAttribute('href');
      assert.equal(href, 'https://drive.google.com/uc?export=download&id=1AbCdEfGhIjKlMnOpQ');
    });

    await step('Admin Peringatan: add quote with Arabic', async () => {
      await go(page, 'peringatan');
      await page.click('text=Tambah Peringatan');
      await page.fill('#f-arab', 'وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَى');
      await page.fill('#f-petikan', 'Peringatan E2E: saling membantu dalam kebaikan.');
      await page.click('button:has-text("Simpan")');
      await toast(page, /ditambah/);
      await synced(page);
      assert.ok(sheet(rt, 'PERINGATAN').find((r) => r.arab.startsWith('وَتَعَاوَنُوا')));
    });

    await step('Admin Kitab: +/- sync to sheet (rapid clicks), add script', async () => {
      await go(page, 'kitab');
      const id = sheet(rt, 'KITAB').find((r) => r.nama_kitab === 'Riyadhus Solihin').id;
      const start = Number(sheet(rt, 'KITAB').find((r) => r.id === id).bilangan);
      const plus = page.locator('button[aria-label="Tambah Riyadhus Solihin"]');
      await plus.click(); await plus.click(); await plus.click();
      await page.locator('button[aria-label="Kurangkan Riyadhus Solihin"]').click();
      await synced(page);
      await page.waitForTimeout(400);
      assert.equal(Number(sheet(rt, 'KITAB').find((r) => r.id === id).bilangan), start + 2);
      assert.match(await page.locator('li', { hasText: 'Riyadhus' }).locator('[aria-label$="kali dipromosi"]').innerText(), new RegExp(`${start + 2}`));

      await page.click('text=+ Tambah skrip');
      await page.fill('#f-tajuk', 'Skrip E2E');
      await page.fill('#f-gdrive_url', 'https://drive.google.com/file/d/1ZZZZZZZZZZZZZ/view');
      await page.click('button:has-text("Simpan")');
      await toast(page, /ditambah/);
      await synced(page);
      assert.equal(sheet(rt, 'PANDUAN').find((r) => r.tajuk === 'Skrip E2E').kategori, 'SKRIP_PROMOSI');
    });

    await step('Admin YouTube: invalid link rejected, youtu.be link -> auto thumbnail', async () => {
      await go(page, 'youtube');
      await page.click('text=Tambah Episod');
      await page.fill('#f-tajuk', 'EP E2E');
      await page.fill('#f-youtube_url', 'https://youtu.be/notvalid');
      await page.waitForSelector('text=Pautan YouTube tidak dikenali');
      await page.click('button:has-text("Simpan")');
      await toast(page, /tidak sah/);
      await page.fill('#f-youtube_url', 'https://youtu.be/dQw4w9WgXcQ?si=share');
      await page.waitForSelector('text=ID video dikesan');
      await page.click('button:has-text("Simpan")');
      await toast(page, /ditambah/);
      await synced(page);
      const card = page.locator('li', { hasText: 'EP E2E' });
      assert.equal(await card.locator('img').getAttribute('src'), 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
      assert.equal(await card.locator('a').first().getAttribute('href'), 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      await page.waitForFunction(() => [...document.querySelectorAll('section li img')].some((i) => i.complete && i.naturalWidth > 120));
    });

    await step('Admin Cadangan: Done toggle + reply sync', async () => {
      await go(page, 'cadangan');
      const b = page.locator('li', { hasText: 'Cadangan E2E' });
      await b.locator('button:has-text("Tandakan Done")').click();
      await toast(page, /selesai/i);
      await b.locator('textarea[aria-label="Maklum balas admin"]').fill('Baik, akan dilaksanakan bulan depan.');
      await b.locator('button:has-text("Simpan")').click();
      await toast(page, /Maklum balas disimpan/);
      await synced(page);
      const row = sheet(rt, 'CADANGAN').find((r) => r.id === myId);
      assert.equal(row.status, 'SELESAI');
      assert.equal(row.balasan_admin, 'Baik, akan dilaksanakan bulan depan.');
    });

    await step('After logout: owner\'s Done item is locked, reply visible', async () => {
      await page.click('button[title="Keluar Mod Admin"]');
      const b = page.locator('li', { hasText: 'Cadangan E2E' });
      await b.locator('text=Dikunci').waitFor();
      assert.equal(await b.locator('button[aria-label="Edit cadangan"]').count(), 0);
      await b.locator('text=akan dilaksanakan').waitFor();
    });

    await step('Stale PIN: admin action after PIN change -> error + auto logout', async () => {
      await adminLogin(page);
      await page.waitForSelector('button[title="Keluar Mod Admin"]');
      rt.props.set('ADMIN_PIN', '999999');
      await go(page, 'kitab');
      await page.locator('button[aria-label="Tambah Riyadhus Solihin"]').click();
      await toast(page, /PIN salah/);
      await page.waitForSelector('button[title="Keluar Mod Admin"]', { state: 'detached' });
      rt.props.set('ADMIN_PIN', PIN);
      rt.cache.clear();
    });

    await step('Stale-while-revalidate: cached data renders instantly while API is slow', async () => {
      let release;
      const gate = new Promise((r) => (release = r));
      await page.route('**/exec?**', async (r) => { await gate; await r.continue(); });
      await page.reload();
      await page.getByRole('heading', { level: 1 }).filter({ hasText: 'Mengurus Hati' }).waitFor({ timeout: 2000 });
      release();
      await synced(page);
      await page.unroute('**/exec?**');
    });

    await step('Offline: API down -> "Luar talian" badge, cached UI stays usable', async () => {
      expectNetErrors = true;
      await page.route('**/exec**', (r) => r.abort());
      await page.reload();
      await page.waitForSelector('text=Luar talian');
      await page.getByRole('heading', { level: 1 }).waitFor();
      await page.unroute('**/exec**');
      await page.click('text=Luar talian');
      await synced(page);
      await page.waitForSelector('text=Luar talian', { state: 'detached' }); // recovered
      expectNetErrors = false;
    });

    await step('First visit + API down: error card with retry (no misleading empty state)', async () => {
      expectNetErrors = true;
      const c2 = await browser.newContext();
      const p2 = await c2.newPage();
      watch(p2, 'firstvisit');
      await p2.route('**/exec**', (r) => r.abort());
      await p2.goto(APP + '#panel');
      await p2.waitForSelector('text=Tidak dapat memuatkan data');
      assert.equal(await p2.locator('text=Tiada rekod').count(), 0);
      await p2.unroute('**/exec**');
      await p2.click('text=Cuba lagi');
      await p2.waitForSelector('#h-panel');
      await c2.close();
      expectNetErrors = false;
    });

    await ctx.close();

    // ------------------------------ MOBILE ------------------------------
    for (const dev of ['iPhone SE', 'iPhone 13', 'Galaxy S9+']) {
      await step(`Mobile ${dev}: no horizontal overflow on any tab (public + admin + modal)`, async () => {
        const mctx = await browser.newContext({ ...devices[dev] });
        await stubThumbs(mctx);
        const mp = await mctx.newPage();
        // Emulate Safari: transformed/animated ancestors become the containing block for position:fixed.
        await mp.addInitScript(() => document.addEventListener('DOMContentLoaded', () => {
          const st = document.createElement('style');
          st.textContent = '.animate-fade-up{will-change:transform}';
          document.head.appendChild(st);
        }));
        watch(mp, dev);
        await mp.goto(APP);
        await synced(mp);
        const tabs = ['upcoming', 'panel', 'panduan', 'peringatan', 'kitab', 'youtube', 'cadangan'];
        for (const t of tabs) { await go(mp, t); await noHorizontalScroll(mp, `${dev} public #${t}`); }
        await adminLogin(mp);
        await mp.waitForSelector('button[title="Keluar Mod Admin"]');
        rt.cache.clear();
        for (const t of tabs) { await go(mp, t); await noHorizontalScroll(mp, `${dev} admin #${t}`); }
        // Every "add" form, opened after scrolling down: overlay must cover the viewport and
        // the Simpan button must be on-screen (regression: sheet trapped inside the section).
        const forms = [['upcoming', /Tambah Slot/], ['panel', /Tambah Panel/], ['panduan', /Tambah Dokumen/],
          ['peringatan', /Tambah Peringatan/], ['kitab', /Tambah Kitab/], ['kitab', /\+ Tambah skrip/],
          ['youtube', /Tambah Episod/]];
        for (const [t, name] of forms) {
          await go(mp, t);
          await mp.evaluate(() => window.scrollTo(0, 300));
          await mp.getByRole('button', { name }).click();
          const g = await mp.evaluate(() => {
            const d = document.querySelector('div[role="dialog"]');
            const o = d.getBoundingClientRect();
            const save = [...d.querySelectorAll('button')].find((x) => /Simpan|Hantar/.test(x.textContent)).getBoundingClientRect();
            return { o: [o.x, o.y, o.width, o.height], vw: innerWidth, vh: innerHeight, saveTop: save.top, saveBottom: save.bottom, inBody: d.parentElement === document.body };
          });
          assert.ok(g.inBody, `${t}: dialog portalled to body`);
          assert.deepEqual(g.o.map(Math.round), [0, 0, g.vw, g.vh], `${dev} ${t}: overlay covers viewport`);
          assert.ok(g.saveTop >= 0 && g.saveBottom <= g.vh + 0.5, `${dev} ${t}: Simpan visible (${g.saveBottom} > ${g.vh})`);
          const fs_ = await mp.locator('div[role="dialog"] input, div[role="dialog"] textarea').first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
          assert.ok(fs_ >= 16, `input font ${fs_}px (iOS zoom)`);
          await mp.keyboard.press('Escape');
          await mp.waitForSelector('div[role="dialog"]', { state: 'detached' });
        }
        await mctx.close();
      });
    }

    // ------------------------------ FOCUS REGRESSION ------------------------------
    await step('Modal keeps focus while background sync re-renders the page', async () => {
      const c = await browser.newContext({ viewport: { width: 1280, height: 860 } });
      const p = await c.newPage();
      watch(p, 'focus');
      await p.goto(APP + '#panel');
      await synced(p);
      await adminLogin(p);
      await p.waitForSelector('button[title="Keluar Mod Admin"]');
      rt.cache.clear();
      await p.click('text=Tambah Panel');
      await p.click('#f-nama_panel');
      await p.keyboard.type('Ustaz ', { delay: 30 });
      await p.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))); // triggers refresh()
      await p.waitForTimeout(400);
      await p.keyboard.type('Fokus', { delay: 30 });
      assert.equal(await p.inputValue('#f-nama_panel'), 'Ustaz Fokus');
      assert.equal(await p.inputValue('#f-tajuk'), '');
      await c.close();
    });

    assert.deepEqual(errors, [], 'console/page errors:\n' + errors.join('\n'));
    console.log(`\n${passed} E2E checks passed, 0 console errors`);
  } finally {
    await browser.close();
    gas.close();
    app.close();
  }
})().catch((e) => {
  console.error('\n✗', e.message);
  if (errors.length) console.error('console errors:\n' + errors.join('\n'));
  process.exit(1);
});
