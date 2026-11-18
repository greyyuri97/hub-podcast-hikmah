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
        <ul className="grid gap-x-5 gap-y-7 md:grid-cols-2">
          {rows.map((r, i) => (
            <li key={r.id} className="flex gap-3">
              {/* speaker avatar */}
              <div className="hidden shrink-0 flex-col items-center sm:flex">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-accent ring-4 ring-bg dark:border dark:border-accent/40">
                  <Star8 className="h-5 w-5" />
                </span>
              </div>
              <figure className="relative flex-1">
                <figcaption className="mb-1.5 flex items-center gap-2 pl-1 text-xs font-semibold text-muted">
                  <span className="text-primary">Tuan Syeikh</span>
                  {r.konteks && <><span aria-hidden>·</span><span className="truncate">{r.konteks}</span></>}
                </figcaption>
                {/* bubble */}
                <div className="relative rounded-card rounded-tl-[4px] border border-line bg-surface p-5 pr-5 shadow-soft">
                  <span aria-hidden className="absolute -left-[7px] top-0 hidden h-3.5 w-3.5 border-l border-t border-line bg-surface sm:block" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)', transform: 'skewX(0)' }} />
                  <Quote size={28} className="absolute right-4 top-4 text-accent/25" aria-hidden />
                  {r.arab && <p dir="rtl" lang="ar" className="arabic mb-3 pr-8 text-right text-xl text-primary sm:text-2xl">{r.arab}</p>}
                  <blockquote className="pr-6 text-[15px] leading-relaxed text-ink">{r.petikan}</blockquote>
                  {isAdmin && (
                    <RowActions
                      className="mt-3 justify-end border-t border-line pt-2"
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
