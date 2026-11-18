import { useMemo, useState } from 'react';
import { CalendarDays, Check, Clock, Copy, Users } from 'lucide-react';
import { useData } from '../lib/store.jsx';
import { BULAN_PENDEK, byOrder, copyText, cx, daysUntil, hariFromISO, parseISO, relativeLabel, todayISO } from '../lib/utils.js';
import { buildWaMessage } from '../lib/wa.js';
import { AddButton, ConfirmModal, Empty, FormModal, RowActions, SectionHeader, moved, useEditor } from '../components/ui.jsx';

const FIELDS = [
  { name: 'tarikh', label: 'Tarikh', type: 'date', required: true, help: 'Hari akan diisi secara automatik.' },
  { name: 'hari', label: 'Hari', required: true, placeholder: 'cth. Khamis' },
  { name: 'masa', label: 'Masa (pilihan)', placeholder: 'cth. 9:00 malam' },
  { name: 'tajuk', label: 'Tajuk', required: true, placeholder: 'Tajuk podcast' },
  { name: 'panel', label: 'Panel', type: 'textarea', rows: 2, required: true, placeholder: 'cth. Ustaz A & Dr. B' },
];

function CopyWa({ item }) {
  const [done, setDone] = useState(false);
  const { toast } = useData();
  const onCopy = async () => {
    const ok = await copyText(buildWaMessage(item));
    if (ok) {
      setDone(true);
      toast('Mesej WhatsApp disalin — tampal dalam group');
      setTimeout(() => setDone(false), 2000);
    } else toast('Gagal menyalin', 'err');
  };
  return (
    <button onClick={onCopy} className={cx('btn-ghost w-full sm:w-auto', done && 'border-accent text-primary')}>
      {done ? <Check size={16} /> : <Copy size={16} />} {done ? 'Disalin!' : 'Salin Info WA'}
    </button>
  );
}

export default function Upcoming() {
  const { db, isAdmin, create, update, remove, reorder } = useData();
  const { editing, setEditing, deleting, setDeleting } = useEditor();
  const rows = useMemo(() => [...db.UPCOMING].sort(byOrder), [db.UPCOMING]);

  const save = (v) => (editing?.id ? update('UPCOMING', editing.id, v) : create('UPCOMING', v));
  const autoHari = (next, changed) => (changed === 'tarikh' ? { ...next, hari: hariFromISO(next.tarikh) } : next);

  return (
    <section aria-labelledby="h-upcoming">
      <SectionHeader
        eyebrow="Jadual"
        title={<span id="h-upcoming">Upcoming Podcast</span>}
        desc="Jadual rakaman & siaran langsung. Tekan “Salin Info WA” untuk kongsi makluman lengkap ke group."
        action={isAdmin && <AddButton onClick={() => setEditing({ tarikh: todayISO(), hari: hariFromISO(todayISO()) })}>Tambah Slot</AddButton>}
      />

      {rows.length === 0 ? (
        <Empty icon={CalendarDays} title="Tiada jadual lagi" hint="Jadual podcast akan datang akan dipaparkan di sini." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {rows.map((r, i) => {
            const d = parseISO(r.tarikh);
            const n = daysUntil(r.tarikh);
            const past = n !== null && n < 0;
            return (
              <li key={r.id} className={cx('card relative flex flex-col gap-4 p-5', past && 'opacity-60')}>
                <div className="flex gap-4">
                  <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-btn border border-accent/40 bg-accent/10 py-2.5 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">{r.hari?.slice(0, 3) || '—'}</span>
                    <span className="text-2xl font-extrabold leading-none text-primary">{d ? d.getDate() : '?'}</span>
                    <span className="text-[11px] font-semibold text-muted">{d ? `${BULAN_PENDEK[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` : ''}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className={cx('chip', past ? 'bg-ink/5 text-muted' : n <= 3 ? 'bg-accent text-on-accent' : 'bg-brand/10 text-primary dark:bg-accent/15')}>
                        {past ? 'Telah berlalu' : relativeLabel(r.tarikh)}
                      </span>
                      {r.masa && <span className="inline-flex items-center gap-1 text-xs text-muted"><Clock size={12} />{r.masa}</span>}
                    </div>
                    <h3 className="font-bold leading-snug text-ink">{r.tajuk}</h3>
                    <p className="mt-1.5 flex items-start gap-1.5 text-sm text-muted"><Users size={15} className="mt-0.5 shrink-0" />{r.panel}</p>
                  </div>
                </div>
                <div className="mt-auto flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <CopyWa item={r} />
                  {isAdmin && (
                    <RowActions
                      className="justify-end"
                      onUp={i > 0 ? () => reorder('UPCOMING', moved(rows, i, -1)) : undefined}
                      onDown={i < rows.length - 1 ? () => reorder('UPCOMING', moved(rows, i, 1)) : undefined}
                      onEdit={() => setEditing(r)}
                      onDelete={() => setDeleting(r)}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <FormModal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit Slot Podcast' : 'Tambah Slot Podcast'}
        fields={FIELDS}
        initial={editing}
        onChange={autoHari}
        onSubmit={save}
      />
      <ConfirmModal open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={() => remove('UPCOMING', deleting.id)} message={`Padam slot “${deleting?.tajuk}”?`} />
    </section>
  );
}
