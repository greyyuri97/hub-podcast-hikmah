import { ArrowRight, CalendarClock, ChevronRight, Mic2, Users } from 'lucide-react';
import { cx } from '../lib/utils.js';
import { useData } from '../lib/store.jsx';
import { byOrder, daysUntil, formatTarikh, hariOf, relativeLabel } from '../lib/utils.js';
import { StarPattern } from './Pattern.jsx';

export function nextUpcoming(rows) {
  return [...rows]
    .filter((r) => daysUntil(r.tarikh) !== null && daysUntil(r.tarikh) >= 0)
    .sort((a, b) => String(a.tarikh).localeCompare(String(b.tarikh)) || byOrder(a, b))[0];
}

/** Slim, tappable "next podcast" strip used on phones for non-Upcoming tabs. */
function HeroStrip({ next, n, goTo }) {
  if (!next) return null;
  return (
    <a
      href="#upcoming"
      onClick={(e) => { e.preventDefault(); goTo('upcoming', { scroll: 'top' }); }}
      className="relative flex min-h-[56px] items-center gap-3 overflow-hidden rounded-card bg-brand px-4 py-2.5 text-on-brand shadow-soft active:brightness-110 dark:border dark:border-accent/25 sm:hidden"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-accent/40 text-accent"><Mic2 size={16} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold uppercase tracking-[0.12em] text-accent">Seterusnya</span>
        <span className="block truncate text-sm font-semibold">{next.tajuk}</span>
      </span>
      <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-on-accent">{n === 0 ? 'Hari ini' : n === 1 ? 'Esok' : `${n} hari`}</span>
      <ChevronRight size={18} className="-mr-1 shrink-0 text-on-brand/60" />
    </a>
  );
}

export function Hero({ goTo, compact = false }) {
  const { db, hasData } = useData();
  const next = nextUpcoming(db.UPCOMING);
  const n = next ? daysUntil(next.tarikh) : null;

  return (
    <>
    {compact && <HeroStrip next={next} n={n} goTo={goTo} />}
    <section className={cx('relative overflow-hidden rounded-card bg-brand text-on-brand shadow-soft dark:border dark:border-accent/25', compact && 'hidden sm:block')}>
      {/* geometric watermark, gold @ 6% */}
      <div className="text-accent"><StarPattern id="hero-star" opacity={0.06} /></div>
      {/* arch / dome motif */}
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-10 hidden h-[130%] w-72 rounded-t-full border-[1.5px] border-accent/30 sm:block" />
      <div aria-hidden className="pointer-events-none absolute -right-6 top-6 hidden h-[120%] w-52 rounded-t-full border border-accent/20 sm:block" />

      <div className="relative grid gap-5 px-5 py-6 sm:gap-6 sm:px-8 sm:py-9 md:grid-cols-[1fr_auto] md:items-end">
        <div className="min-w-0">
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-accent">
            <Mic2 size={12} /> Podcast Seterusnya
          </p>
          {!hasData ? (
            <div className="space-y-3">
              <div className="h-7 w-3/4 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-white/10" />
            </div>
          ) : next ? (
            <>
              <h1 className="text-[26px] font-extrabold leading-[1.15] tracking-tight wrap-anywhere sm:text-[2rem]">{next.tajuk}</h1>
              <div className="mt-4 flex flex-col gap-2 text-[15px] text-on-brand/85 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:text-sm">
                <span className="inline-flex items-start gap-2">
                  <CalendarClock size={17} className="mt-0.5 shrink-0 text-accent" />
                  {hariOf(next)}, {formatTarikh(next.tarikh)}{next.masa ? ` · ${next.masa}` : ''}
                </span>
                {next.panel && (
                  <span className="inline-flex items-start gap-2 wrap-anywhere"><Users size={17} className="mt-0.5 shrink-0 text-accent" />{next.panel}</span>
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:flex-col md:items-end">
          {next && (
            <div className="flex items-baseline gap-2 md:justify-end">
              {n === 0 ? (
                <span className="text-3xl font-extrabold text-accent">Hari ini</span>
              ) : (
                <>
                  <span className="text-4xl font-extrabold tabular-nums text-accent">{n}</span>
                  <span className="text-sm font-medium text-on-brand/75">hari lagi</span>
                </>
              )}
              <span className="sr-only">{relativeLabel(next.tarikh)}</span>
            </div>
          )}
          <button className="btn-gold min-h-12 px-5 text-base sm:text-sm" onClick={() => goTo('panduan', { scroll: 'top' })}>
            Panduan Panel <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
    </>
  );
}
