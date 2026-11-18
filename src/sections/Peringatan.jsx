import { useMemo } from 'react';
import { MessageSquareQuote, Quote } from 'lucide-react';
import { useData } from '../lib/store.jsx';
import { byOrder } from '../lib/utils.js';
import { Star8 } from '../components/Pattern.jsx';
import { AddButton, ConfirmModal, Empty, FormModal, RowActions, SectionHeader, moved, useEditor } from '../components/ui.jsx';

const FIELDS = [
  { name: 'arab', label: 'Teks Arab (pilihan)', type: 'textarea', rows: 2, dir: 'rtl', placeholder: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ' },
  { name: 'petikan', label: 'Peringatan / Nasihat', type: 'textarea', rows: 4, required: true },
  { name: 'konteks', label: 'Konteks / Sumber (pilihan)', placeholder: 'cth. Taklimat Panel, Rejab 1448H' },
];

export default function Peringatan() {
  const { db, isAdmin, create, update, remove, reorder } = useData();
  const { editing, setEditing, deleting, setDeleting } = useEditor();
  const rows = useMemo(() => [...db.PERINGATAN].sort(byOrder), [db.PERINGATAN]);
  const save = (v) => (editing?.id ? update('PERINGATAN', editing.id, v) : create('PERINGATAN', v));

  return (
    <section aria-labelledby="h-peringatan">
      <SectionHeader
        eyebrow="Adab & Nasihat"
        title={<span id="h-peringatan">Peringatan Syeikhuna</span>}
        desc="Pesanan dan adab daripada Tuan Syeikh untuk semua yang terlibat dalam majlis ilmu ini."
        action={isAdmin && <AddButton onClick={() => setEditing({})}>Tambah Peringatan</AddButton>}
      />

      {rows.length === 0 ? (
        <Empty icon={MessageSquareQuote} title="Tiada peringatan lagi" />
      ) : (
        <ul className="grid gap-x-5 gap-y-6 md:grid-cols-2 sm:gap-y-7">
          {rows.map((r, i) => (
            <li key={r.id} className="flex gap-3">
              {/* speaker avatar */}
              <div className="hidden shrink-0 flex-col items-center sm:flex">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-accent ring-4 ring-bg dark:border dark:border-accent/40">
                  <Star8 className="h-5 w-5" />
                </span>
              </div>
              <figure className="relative flex-1">
                <figcaption className="mb-2 flex items-center gap-2 pl-1 text-[13px] font-semibold text-muted">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-accent sm:hidden dark:border dark:border-accent/40">
                    <Star8 className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1 leading-snug">
                    <span className="text-primary">Tuan Syeikh</span>
                    {r.konteks && <span className="wrap-anywhere"><span aria-hidden> · </span>{r.konteks}</span>}
                  </span>
                  <Quote size={20} className="shrink-0 text-accent/50" aria-hidden />
                </figcaption>
                {/* bubble */}
                <div className="relative rounded-card rounded-tl-[4px] border border-line bg-surface p-4 shadow-soft sm:p-5">
                  <span aria-hidden className="absolute -left-[7px] top-0 hidden h-3.5 w-3.5 border-l border-t border-line bg-surface sm:block" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)', transform: 'skewX(0)' }} />
                  {r.arab && (
                    <p dir="rtl" lang="ar" className="arabic mb-3 border-b border-line/70 pb-3 text-right text-2xl text-primary wrap-anywhere sm:text-[28px]">
                      {r.arab}
                    </p>
                  )}
                  <blockquote className="text-base leading-[1.75] text-ink wrap-anywhere sm:text-[15px]">{r.petikan}</blockquote>
                  {isAdmin && (
                    <RowActions
                      className="-mx-2 -mb-2 mt-3 justify-end border-t border-line pt-1"
                      onUp={i > 0 ? () => reorder('PERINGATAN', moved(rows, i, -1)) : undefined}
                      onDown={i < rows.length - 1 ? () => reorder('PERINGATAN', moved(rows, i, 1)) : undefined}
                      onEdit={() => setEditing(r)}
                      onDelete={() => setDeleting(r)}
                    />
                  )}
                </div>
              </figure>
            </li>
          ))}
        </ul>
      )}

      <FormModal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Peringatan' : 'Tambah Peringatan'} fields={FIELDS} initial={editing} onSubmit={save} />
      <ConfirmModal open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={() => remove('PERINGATAN', deleting.id)} />
    </section>
  );
}
