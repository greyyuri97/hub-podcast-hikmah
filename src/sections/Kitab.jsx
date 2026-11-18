import { useMemo, useState } from 'react';
import { ArrowDownUp, BookMarked, Minus, Plus } from 'lucide-react';
import { useData } from '../lib/store.jsx';
import { byOrder, cx } from '../lib/utils.js';
import { PANDUAN_KATEGORI } from '../lib/schema.js';
import { DriveCard, DRIVE_FIELDS } from '../components/DriveCard.jsx';
import { AddButton, ConfirmModal, Empty, FormModal, RowActions, SectionHeader, useEditor } from '../components/ui.jsx';

const FIELDS = [
  { name: 'nama_kitab', label: 'Nama Kitab', required: true, placeholder: 'cth. Riyadhus Solihin' },
  { name: 'bilangan', label: 'Bilangan Kekerapan Promosi', type: 'number', min: 0, placeholder: '0' },
];

function Badge({ n }) {
  return (
    <span
      className={cx('grid h-11 min-w-[3.25rem] shrink-0 place-items-center rounded-full px-2.5 text-base font-extrabold tabular-nums', n === 0 ? 'bg-ink/5 text-muted' : 'bg-accent text-on-accent')}
      aria-label={`${n} kali dipromosi`}
      title="Bilangan kekerapan promosi"
    >
      {n}×
    </span>
  );
}

export default function Kitab() {
  const { db, isAdmin, create, update, remove, increment } = useData();
  const book = useEditor();
  const script = useEditor();
  const [asc, setAsc] = useState(true);

  const rows = useMemo(
    () => [...db.KITAB].sort((a, b) => (asc ? 1 : -1) * ((Number(a.bilangan) || 0) - (Number(b.bilangan) || 0)) || String(a.nama_kitab).localeCompare(b.nama_kitab)),
    [db.KITAB, asc],
  );
  const max = Math.max(1, ...rows.map((r) => Number(r.bilangan) || 0));
  const scripts = useMemo(() => db.PANDUAN.filter((r) => r.kategori === PANDUAN_KATEGORI.SKRIP).sort(byOrder), [db.PANDUAN]);

  const saveBook = (v) => {
    const item = { ...v, bilangan: Number(v.bilangan) || 0 };
    return book.editing?.id ? update('KITAB', book.editing.id, item) : create('KITAB', item);
  };
  const saveScript = (v) =>
    script.editing?.id ? update('PANDUAN', script.editing.id, v) : create('PANDUAN', { ...v, kategori: PANDUAN_KATEGORI.SKRIP });

  return (
    <section aria-labelledby="h-kitab">
      <SectionHeader
        eyebrow="Promosi"
        title={<span id="h-kitab">Promosi Kitab</span>}
        desc="Pantau kekerapan promosi setiap kitab supaya giliran adil. Kitab paling kurang dipromosi dipaparkan dahulu."
        action={isAdmin && <AddButton onClick={() => book.setEditing({ bilangan: 0 })}>Tambah Kitab</AddButton>}
      />

      {/* grid-cols-1 + min-w-0: a long nowrap kitab name must not widen the column past the screen */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <div className="mb-1 flex items-center justify-between gap-3">
            <p className="text-[13px] font-medium text-muted">{rows.length} kitab</p>
            <button className="hit -mr-2 gap-1.5 rounded-btn px-2 text-[13px] font-semibold text-muted hover:text-ink" onClick={() => setAsc((a) => !a)}>
              <ArrowDownUp size={14} /> {asc ? 'Paling kurang dahulu' : 'Paling kerap dahulu'}
            </button>
          </div>
          {rows.length === 0 ? (
            <Empty icon={BookMarked} title="Tiada kitab disenaraikan" />
          ) : (
            <ul className="card divide-y divide-line overflow-hidden">
              {rows.map((r) => {
                const n = Number(r.bilangan) || 0;
                return (
                  <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3.5 sm:flex-nowrap sm:px-5">
                    <BookMarked size={20} className="shrink-0 self-start text-primary sm:self-center" strokeWidth={1.8} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug text-ink wrap-anywhere">{r.nama_kitab}</p>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
                        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(n / max) * 100}%` }} />
                      </div>
                    </div>
                    {!isAdmin && <Badge n={n} />}
                    {isAdmin && (
                      <div className="-ml-2 flex w-full items-center justify-end gap-2 sm:ml-0 sm:w-auto">
                        <RowActions className="mr-auto sm:order-last sm:mr-0" onEdit={() => book.setEditing(r)} onDelete={() => book.setDeleting(r)} />
                        <button className="btn-icon border border-line" onClick={() => increment('KITAB', r.id, -1)} disabled={n <= 0} aria-label={`Kurangkan ${r.nama_kitab}`}>
                          <Minus size={15} />
                        </button>
                        <Badge n={n} />
                        <button className="btn-icon border border-line" onClick={() => increment('KITAB', r.id, 1)} aria-label={`Tambah ${r.nama_kitab}`}>
                          <Plus size={15} />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className="min-w-0 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Skrip Promosi</h3>
            {isAdmin && <button className="hit -mr-2 rounded-btn px-2 text-sm font-semibold text-primary hover:underline" onClick={() => script.setEditing({})}>+ Tambah skrip</button>}
          </div>
          {scripts.length === 0 ? (
            <Empty title="Tiada skrip" hint="Admin boleh menambah pautan PDF skrip promosi." />
          ) : (
            scripts.map((s) => (
              <DriveCard key={s.id} item={s} featured isAdmin={isAdmin} onEdit={() => script.setEditing(s)} onDelete={() => script.setDeleting(s)} />
            ))
          )}
        </aside>
      </div>

      <FormModal open={Boolean(book.editing)} onClose={() => book.setEditing(null)} title={book.editing?.id ? 'Edit Kitab' : 'Tambah Kitab'} fields={FIELDS} initial={book.editing} onSubmit={saveBook} />
      <ConfirmModal open={Boolean(book.deleting)} onClose={() => book.setDeleting(null)} onConfirm={() => remove('KITAB', book.deleting.id)} message={`Padam “${book.deleting?.nama_kitab}”?`} />
      <FormModal open={Boolean(script.editing)} onClose={() => script.setEditing(null)} title={script.editing?.id ? 'Edit Skrip Promosi' : 'Tambah Skrip Promosi'} fields={DRIVE_FIELDS} initial={script.editing} onSubmit={saveScript} />
      <ConfirmModal open={Boolean(script.deleting)} onClose={() => script.setDeleting(null)} onConfirm={() => remove('PANDUAN', script.deleting.id)} />
    </section>
  );
}
