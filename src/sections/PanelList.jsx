import { useMemo, useState } from 'react';
import { Search, UserRound, Users, X } from 'lucide-react';
import { useData } from '../lib/store.jsx';
import { cx, daysUntil, formatTarikh } from '../lib/utils.js';
import { AddButton, ConfirmModal, Empty, FormModal, RowActions, SectionHeader, useEditor } from '../components/ui.jsx';

const FIELDS = [
  { name: 'tajuk', label: 'Tajuk', required: true, placeholder: 'Tajuk episod' },
  { name: 'nama_panel', label: 'Nama Panel', required: true, placeholder: 'cth. Ustaz Hafiz Rahman' },
  { name: 'tarikh', label: 'Tarikh (pilihan)', type: 'date' },
];

const norm = (s) => String(s || '').toLowerCase().normalize('NFKD');

export default function PanelList() {
  const { db, isAdmin, create, update, remove } = useData();
  const { editing, setEditing, deleting, setDeleting } = useEditor();
  const [q, setQ] = useState('');
  const [when, setWhen] = useState('semua');

  const rows = useMemo(() => {
    const term = norm(q).trim();
    return [...db.PANEL]
      .filter((r) => !term || norm(`${r.tajuk} ${r.nama_panel}`).includes(term))
      .filter((r) => {
        if (when === 'semua') return true;
        const n = daysUntil(r.tarikh);
        if (n === null) return when === 'lepas';
        return when === 'akan' ? n >= 0 : n < 0;
      })
      .sort((a, b) => String(b.tarikh || '').localeCompare(String(a.tarikh || '')) || norm(a.tajuk).localeCompare(norm(b.tajuk)));
  }, [db.PANEL, q, when]);

  const save = (v) => (editing?.id ? update('PANEL', editing.id, v) : create('PANEL', v));

  return (
    <section aria-labelledby="h-panel">
      <SectionHeader
        eyebrow="Direktori"
        title={<span id="h-panel">List Panel</span>}
        desc="Arkib tajuk dan panel — semak siapa pernah atau akan menjadi panel sebelum menjemput."
        action={isAdmin && <AddButton onClick={() => setEditing({})}>Tambah Panel</AddButton>}
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Cari panel atau tajuk</span>
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input type="search" enterKeyHint="search" className="input bg-surface pl-10 pr-12" placeholder="Cari nama panel atau tajuk…" value={q} onChange={(e) => setQ(e.target.value)} />
          {q && (
            <button className="btn-icon absolute right-0 top-1/2 -translate-y-1/2" onClick={() => setQ('')} aria-label="Kosongkan carian"><X size={17} /></button>
          )}
        </label>
        <div className="segmented" role="tablist" aria-label="Tapis masa">
          {[['semua', 'Semua'], ['akan', 'Akan datang'], ['lepas', 'Lepas']].map(([v, l]) => (
            <button key={v} role="tab" aria-selected={when === v} onClick={() => setWhen(v)}
              className={cx('segment sm:px-3', when === v ? 'bg-brand text-on-brand dark:text-accent' : 'text-muted hover:text-ink')}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-3 text-[13px] font-medium text-muted">{rows.length} rekod</p>

      {rows.length === 0 ? (
        <Empty icon={Users} title={q ? 'Tiada padanan' : 'Tiada rekod panel'} hint={q ? `Tiada keputusan untuk “${q}”.` : undefined} />
      ) : (
        <ul className="card divide-y divide-line overflow-hidden">
          {rows.map((r) => {
            const n = daysUntil(r.tarikh);
            return (
              <li key={r.id} className="flex min-h-[64px] items-center gap-3 px-4 py-3 sm:gap-3.5 sm:px-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/10 text-primary dark:bg-accent/15"><UserRound size={18} /></span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 font-semibold leading-snug text-ink wrap-anywhere">{r.nama_panel}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-muted wrap-anywhere">{r.tajuk}</p>
                  {r.tarikh && <p className="mt-1 text-[13px] font-medium text-muted sm:hidden">{formatTarikh(r.tarikh, { short: true })}</p>}
                </div>
                {r.tarikh && (
                  <span className={cx('chip hidden shrink-0 sm:inline-flex', n !== null && n >= 0 ? 'bg-accent/20 text-ink' : 'bg-ink/5 text-muted')}>
                    {formatTarikh(r.tarikh, { short: true })}
                  </span>
                )}
                {isAdmin && <RowActions onEdit={() => setEditing(r)} onDelete={() => setDeleting(r)} />}
              </li>
            );
          })}
        </ul>
      )}

      <FormModal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Panel' : 'Tambah Panel'} fields={FIELDS} initial={editing} onSubmit={save} />
      <ConfirmModal open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={() => remove('PANEL', deleting.id)} message={`Padam ${deleting?.nama_panel} daripada senarai?`} />
    </section>
  );
}
