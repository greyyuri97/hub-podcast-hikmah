import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CircleDashed, Lightbulb, Lock, Pencil, RotateCcw, Send, ShieldCheck, Trash2 } from 'lucide-react';
import { useData } from '../lib/store.jsx';
import { cx, formatTarikh, storage, store, todayISO } from '../lib/utils.js';
import { STATUS } from '../lib/schema.js';
import { ConfirmModal, Empty, FormModal, SectionHeader, useEditor } from '../components/ui.jsx';

const COOLDOWN_MS = 30_000;
const LAST_KEY = 'hph_last_cadangan';
const MAX = 1000;

const EDIT_FIELDS = [
  { name: 'tarikh', label: 'Tarikh', type: 'date', required: true },
  { name: 'catatan', label: 'Catatan', type: 'textarea', rows: 5, required: true, maxLength: MAX },
];

function NewForm() {
  const { create, toast } = useData();
  const [tarikh, setTarikh] = useState(todayISO);
  const [catatan, setCatatan] = useState('');
  const [hp, setHp] = useState(''); // honeypot
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (hp) return; // bot
    const text = catatan.trim();
    if (text.length < 5) return toast('Sila tulis cadangan sekurang-kurangnya 5 aksara', 'err');
    const last = storage(LAST_KEY, 0);
    const wait = Math.ceil((COOLDOWN_MS - (Date.now() - last)) / 1000);
    if (wait > 0) return toast(`Sila tunggu ${wait} saat sebelum menghantar lagi`, 'err');
    setBusy(true);
    const row = await create('CADANGAN', { tarikh, catatan: text, status: STATUS.BELUM, balasan_admin: '' }, 'Terima kasih! Cadangan anda dihantar.');
    setBusy(false);
    if (row) {
      store(LAST_KEY, Date.now());
      setCatatan('');
      setTarikh(todayISO());
    }
  };

  return (
    <form onSubmit={submit} className="card relative mb-7 overflow-hidden p-4 sm:mb-8 sm:p-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-accent" aria-hidden />
      <h3 className="mb-1 text-[17px] font-bold text-ink sm:text-base">Kongsi cadangan anda</h3>
      <p className="mb-4 text-[15px] leading-relaxed text-muted sm:text-sm">Idea penambahbaikan untuk podcast atau hub ini. Anda boleh mengedit cadangan sendiri dari pelayar ini sehingga ditandakan selesai.</p>
      <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
        <div>
          <label className="label" htmlFor="cad-tarikh">Tarikh</label>
          <input id="cad-tarikh" type="date" className="input" value={tarikh} onChange={(e) => setTarikh(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="cad-catatan">Catatan</label>
          <textarea id="cad-catatan" rows={4} className="input resize-y" maxLength={MAX} placeholder="Tulis cadangan anda di sini…" value={catatan} onChange={(e) => setCatatan(e.target.value)} required />
          <p className="mt-1 text-right text-xs tabular-nums text-muted">{catatan.length}/{MAX}</p>
        </div>
      </div>
      {/* honeypot: hidden from humans */}
      <input type="text" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden="true" name="website" />
      <div className="mt-2 flex sm:justify-end">
        <button className="btn-gold w-full min-h-12 text-base sm:w-auto sm:text-sm" disabled={busy}><Send size={16} /> {busy ? 'Menghantar…' : 'Hantar Cadangan'}</button>
      </div>
    </form>
  );
}

function AdminReply({ item }) {
  const { update } = useData();
  const [val, setVal] = useState(item.balasan_admin || '');
  useEffect(() => setVal(item.balasan_admin || ''), [item.balasan_admin]);
  const dirty = val !== (item.balasan_admin || '');
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <textarea
        rows={2}
        className="input flex-1 bg-surface"
        placeholder="Tulis maklum balas admin…"
        maxLength={2000}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        aria-label="Maklum balas admin"
      />
      <button className="btn-brand w-full shrink-0 sm:w-auto" disabled={!dirty} onClick={() => update('CADANGAN', item.id, { balasan_admin: val }, 'Maklum balas disimpan')}>
        Simpan
      </button>
    </div>
  );
}

function Bubble({ item, onEdit, onDelete }) {
  const { isAdmin, isMine, update } = useData();
  const done = item.status === STATUS.SELESAI;
  const mine = isMine(item.id);
  const canEdit = isAdmin || (mine && !done);

  return (
    <li className={cx('overflow-hidden rounded-card border shadow-soft transition', done ? 'border-accent/50' : 'border-line')}>
      {/* User part */}
      <div className="bg-surface p-4 sm:p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold text-muted">{formatTarikh(item.tarikh)}</span>
          {mine && <span className="chip bg-brand/10 text-primary dark:bg-accent/15">Cadangan anda</span>}
          <div className="-my-2 -mr-2 ml-auto flex items-center">
            {canEdit && <button className="btn-icon" onClick={onEdit} aria-label="Edit cadangan"><Pencil size={15} /></button>}
            {mine && done && !isAdmin && <span className="inline-flex min-h-11 items-center gap-1 px-2 text-xs text-muted" title="Dikunci selepas selesai"><Lock size={13} /> Dikunci</span>}
            {isAdmin && <button className="btn-icon hover:!text-danger" onClick={onDelete} aria-label="Padam cadangan"><Trash2 size={15} /></button>}
          </div>
        </div>
        <p className={cx('whitespace-pre-line text-base leading-relaxed text-ink wrap-anywhere sm:text-[15px]', done && 'text-ink/70')}>{item.catatan}</p>
      </div>

      {/* Admin part */}
      <div className={cx('border-t p-4 sm:px-5', done ? 'border-accent/40 bg-accent/10' : 'border-line bg-bg')}>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {isAdmin ? (
            <button
              onClick={() => update('CADANGAN', item.id, { status: done ? STATUS.BELUM : STATUS.SELESAI }, done ? 'Ditanda belum selesai' : 'Ditanda selesai')}
              className={cx('inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition', done ? 'border-transparent bg-accent text-on-accent' : 'border-line bg-surface text-ink hover:border-accent')}
              aria-pressed={done}
            >
              {done ? <CheckCircle2 size={17} /> : <CircleDashed size={17} />}
              {done ? 'Done' : 'Tandakan Done'}
              {done && <RotateCcw size={14} className="ml-0.5 opacity-60" />}
            </button>
          ) : (
            <span className={cx('chip', done ? 'bg-accent text-on-accent' : 'bg-ink/5 text-muted')}>
              {done ? <CheckCircle2 size={14} /> : <CircleDashed size={14} />} {done ? 'Selesai' : 'Belum Selesai'}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted"><ShieldCheck size={13} /> Maklum balas admin</span>
        </div>
        {isAdmin ? (
          <AdminReply item={item} />
        ) : item.balasan_admin ? (
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink wrap-anywhere sm:text-sm">{item.balasan_admin}</p>
        ) : (
          <p className="text-[15px] italic text-muted sm:text-sm">Menunggu maklum balas.</p>
        )}
      </div>
    </li>
  );
}

export default function Cadangan() {
  const { db, update, remove, isAdmin } = useData();
  const { editing, setEditing, deleting, setDeleting } = useEditor();
  const [filter, setFilter] = useState('semua');

  const all = useMemo(
    () => [...db.CADANGAN].sort((a, b) => String(b.tarikh).localeCompare(String(a.tarikh)) || String(b.created_at).localeCompare(String(a.created_at))),
    [db.CADANGAN],
  );
  const counts = {
    semua: all.length,
    belum: all.filter((r) => r.status !== STATUS.SELESAI).length,
    selesai: all.filter((r) => r.status === STATUS.SELESAI).length,
  };
  const rows = all.filter((r) => (filter === 'semua' ? true : filter === 'selesai' ? r.status === STATUS.SELESAI : r.status !== STATUS.SELESAI));

  return (
    <section aria-labelledby="h-cadangan">
      <SectionHeader
        eyebrow="Maklum Balas"
        title={<span id="h-cadangan">Cadangan</span>}
        desc="Ruang terbuka untuk semua. Admin akan menandakan cadangan yang telah diambil tindakan."
      />

      <NewForm />

      <div className="segmented mb-5 sm:inline-flex" role="tablist" aria-label="Tapis status">
        {[['semua', 'Semua'], ['belum', 'Belum Selesai'], ['selesai', 'Selesai']].map(([v, l]) => (
          <button key={v} role="tab" aria-selected={filter === v} onClick={() => setFilter(v)}
            className={cx('segment', filter === v ? 'bg-brand text-on-brand dark:text-accent' : 'text-muted hover:text-ink')}>
            {l} <span className="text-xs tabular-nums opacity-70">{counts[v]}</span>
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <Empty icon={Lightbulb} title="Tiada cadangan di sini" hint={filter === 'semua' ? 'Jadilah yang pertama berkongsi idea!' : undefined} />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {rows.map((r) => <Bubble key={r.id} item={r} onEdit={() => setEditing(r)} onDelete={() => setDeleting(r)} />)}
        </ul>
      )}

      <FormModal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit Cadangan"
        fields={EDIT_FIELDS}
        initial={editing ? { tarikh: editing.tarikh, catatan: editing.catatan } : null}
        onSubmit={(v) => update('CADANGAN', editing.id, isAdmin ? v : { tarikh: v.tarikh, catatan: v.catatan })}
      />
      <ConfirmModal open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={() => remove('CADANGAN', deleting.id)} message="Padam cadangan ini?" />
    </section>
  );
}
