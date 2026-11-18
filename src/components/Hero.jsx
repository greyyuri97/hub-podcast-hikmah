import { ArrowRight, CalendarClock, Mic2, Users } from 'lucide-react';
import { useData } from '../lib/store.jsx';
import { byOrder, daysUntil, formatTarikh, relativeLabel } from '../lib/utils.js';
import { StarPattern } from './Pattern.jsx';

export function nextUpcoming(rows) {
  return [...rows]
    .filter((r) => daysUntil(r.tarikh) !== null && daysUntil(r.tarikh) >= 0)
    .sort((a, b) => String(a.tarikh).localeCompare(String(b.tarikh)) || byOrder(a, b))[0];
}

export function Hero({ goTo }) {
  const { db, hasData } = useData();
  const next = nextUpcoming(db.UPCOMING);
  const n = next ? daysUntil(next.tarikh) : null;

  return (
    <section className="relative overflow-hidden rounded-card bg-brand text-on-brand shadow-soft dark:border dark:border-accent/25">
      {/* geometric watermark, gold @ 6% */}
      <div className="text-accent"><StarPattern id="hero-star" opacity={0.06} /></div>
      {/* arch / dome motif */}
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-10 hidden h-[130%] w-72 rounded-t-full border-[1.5px] border-accent/30 sm:block" />
      <div aria-hidden className="pointer-events-none absolute -right-6 top-6 hidden h-[120%] w-52 rounded-t-full border border-accent/20 sm:block" />

      <div className="relative grid gap-6 px-5 py-6 sm:px-8 sm:py-9 md:grid-cols-[1fr_auto] md:items-end">
        <div className="min-w-0">
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
            <Mic2 size={12} /> Podcast Seterusnya
          </p>
          {!hasData ? (
            <div className="space-y-3">
              <div className="h-7 w-3/4 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-white/10" />
            </div>
          ) : next ? (
            <>
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-[2rem]">{next.tajuk}</h1>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-on-brand/85">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock size={16} className="text-accent" />
                  {next.hari}, {formatTarikh(next.tarikh)}{next.masa ? ` · ${next.masa}` : ''}
                </span>
                {next.panel && (
                  <span className="inline-flex items-center gap-1.5"><Users size={16} className="text-accent" />{next.panel}</span>
                )}
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-[2rem]">Assalamualaikum, selamat datang.</h1>
              <p className="mt-3 max-w-lg text-sm text-on-brand/80">Tiada jadual podcast akan datang buat masa ini. Semak panduan panel sementara menunggu jemputan seterusnya.</p>
            </>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row md:flex-col md:items-end">
          {next && (
            <div className="flex items-baseline gap-2 md:justify-end">
              <span className="text-4xl font-extrabold tabular-nums text-accent">{n === 0 ? 'Hari ini' : n}</span>
              {n > 0 && <span className="text-sm font-medium text-on-brand/75">{n === 1 ? 'hari lagi' : 'hari lagi'}</span>}
              <span className="sr-only">{relativeLabel(next.tarikh)}</span>
            </div>
          )}
          <button className="btn-gold px-5 py-3" onClick={() => goTo('panduan')}>
            Panduan Panel <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
