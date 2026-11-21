import { useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Check, Copy, Users } from 'lucide-react';
import { useData } from '../lib/store.jsx';
import { BULAN_PENDEK, copyText, cx, daysUntil, parseISO, relativeLabel } from '../lib/utils.js';
import { deriveSchedule } from '../lib/schedule.js';
import { buildWaMessage } from '../lib/wa.js';
import { Empty, SectionHeader } from '../components/ui.jsx';

/** Admin-only: the component itself refuses to render for public users, wherever it is placed. */
function CopyWa({ item }) {
  const [done, setDone] = useState(false);
  const { toast, isAdmin } = useData();
  if (!isAdmin) return null;
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

/** Jumps to List Panel, where the schedule is managed. */
function ManageLink({ className = '' }) {
  return (
    <a
      href="#panel"
      onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
      className={cx('btn-ghost self-start sm:self-auto', className)}
    >
      Urus jadual di List Panel <ArrowRight size={16} />
    </a>
  );
}

/**
 * Read-only schedule derived from LIST PANEL (single source of truth):
 * dated entries from today onward, grouped by tajuk + tarikh, nearest first.
 */
export default function Upcoming() {
  const { db, isAdmin } = useData();
  const rows = useMemo(() => deriveSchedule(db.PANEL), [db.PANEL]);

  return (
    <section aria-labelledby="h-upcoming">
      <SectionHeader
        eyebrow="Jadual"
        title={<span id="h-upcoming">Upcoming Podcast</span>}
        desc={
          isAdmin
            ? 'Dijana automatik daripada List Panel yang bertarikh. Tekan “Salin Info WA” untuk kongsi makluman lengkap ke group.'
            : 'Jadual rakaman & siaran langsung podcast yang akan datang.'
        }
        action={isAdmin && <ManageLink />}
      />

      {rows.length === 0 ? (
        <Empty
          icon={CalendarDays}
          title="Tiada jadual lagi"
          hint={isAdmin ? 'Tambah panel dengan tarikh di List Panel untuk memaparkannya di sini.' : 'Jadual akan dipaparkan sebaik sahaja tarikh rakaman ditetapkan.'}
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {rows.map((r) => {
            const d = parseISO(r.tarikh);
            const n = daysUntil(r.tarikh);
            return (
              <li key={r.id} data-slot={r.id} className="card relative flex flex-col gap-4 p-4 sm:p-5">
                <div className="flex gap-3.5 sm:gap-4">
                  <div className="flex w-[60px] shrink-0 flex-col items-center justify-center self-start rounded-btn border border-accent/40 bg-accent/10 py-2 text-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted">{r.hari.slice(0, 3)}</span>
                    <span className="text-2xl font-extrabold leading-none text-primary">{d.getDate()}</span>
                    <span className="text-xs font-semibold text-muted">{`${BULAN_PENDEK[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className={cx('chip', n <= 3 ? 'bg-accent text-on-accent' : 'bg-brand/10 text-primary dark:bg-accent/15')}>
                        {relativeLabel(r.tarikh)}
                      </span>
                      <span className="text-[13px] font-medium text-muted">{r.hari}</span>
                    </div>
                    <h3 className="text-[17px] font-bold leading-snug text-ink wrap-anywhere sm:text-base">{r.tajuk}</h3>
                    <p className="mt-1.5 flex items-start gap-1.5 text-[15px] leading-snug text-muted wrap-anywhere sm:text-sm">
                      <Users size={15} className="mt-0.5 shrink-0" />
                      <span data-testid="slot-panel">{r.panel}</span>
                    </p>
                  </div>
                </div>
                {/* Admin-only footer: Salin Info WA. Public cards end at the content. */}
                {isAdmin && (
                  <div className="mt-auto border-t border-line pt-3.5">
                    <CopyWa item={r} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
