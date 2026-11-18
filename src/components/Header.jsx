import { useEffect, useRef, useState } from 'react';
import { CloudOff, Moon, RefreshCw, ShieldCheck, Sun, Check } from 'lucide-react';
import { useData } from '../lib/store.jsx';
import { cx, storage } from '../lib/utils.js';
import { Star8 } from './Pattern.jsx';
import { TABS } from './nav.js';

function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    // Keep the browser/status-bar colour in sync with a manual toggle.
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
      m.setAttribute('content', dark ? '#081C15' : '#0F4C3A');
      m.removeAttribute('media');
    });
  }, [dark]);
  const toggle = () =>
    setDark((d) => {
      try { localStorage.setItem('hph_theme', d ? 'light' : 'dark'); } catch { /* noop */ }
      return !d;
    });
  return [dark, toggle];
}

export function SyncBadge() {
  const { syncing, error, lastSync, mode, refresh } = useData();
  const time = lastSync ? new Date(lastSync).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }) : null;
  let icon, text, tone;
  if (syncing) { icon = <RefreshCw size={13} className="animate-spin" />; text = 'Menyegerak…'; tone = 'text-muted'; }
  else if (error) { icon = <CloudOff size={13} />; text = 'Luar talian'; tone = 'text-accent'; }
  else { icon = <Check size={13} />; text = time ? `Dikemas kini ${time}` : 'Sedia'; tone = 'text-muted'; }
  return (
    <button
      onClick={() => refresh({ silent: false })}
      title={error ? `Ralat: ${error}. Klik untuk cuba lagi.` : 'Klik untuk segerak semula'}
      className={cx('hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium hover:bg-ink/5 sm:inline-flex', tone)}
    >
      {icon}<span className={cx('whitespace-nowrap', !error && 'lg:hidden 2xl:inline')}>{text}</span>
      {mode === 'mock' && <span className="ml-1 rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink">Demo</span>}
    </button>
  );
}

export function Header({ tab, setTab }) {
  const [dark, toggle] = useTheme();
  const { isAdmin, logout, syncing, error, refresh } = useData();
  const scroller = useRef(null);

  // keep active tab visible on mobile
  useEffect(() => {
    const el = scroller.current?.querySelector(`[data-tab="${tab}"]`);
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [tab]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md supports-[backdrop-filter]:bg-bg/75">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:px-6">
        <a href="#upcoming" onClick={() => setTab('upcoming')} className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-brand text-accent dark:border dark:border-accent/40">
            <Star8 className="h-5 w-5" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[15px] font-extrabold tracking-tight text-ink">HUB PODCAST HIKMAH</span>
            <span className="block truncate text-[11px] font-medium text-muted">Pusat maklumat panel & moderator</span>
          </span>
        </a>

        <nav className="ml-auto hidden items-center gap-0.5 lg:flex" aria-label="Seksyen utama">
          {TABS.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
              className={cx(
                'whitespace-nowrap rounded-btn px-2.5 py-2 text-[13px] font-semibold transition xl:px-3',
                tab === t.id ? 'bg-brand text-on-brand dark:text-accent dark:ring-1 dark:ring-accent/40' : 'text-muted hover:bg-ink/5 hover:text-ink',
              )}
            >
              {t.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-2">
          {error && !syncing ? (
            <button className="btn-icon text-accent sm:hidden" onClick={() => refresh({ silent: false })} aria-label="Luar talian — cuba segerak semula">
              <CloudOff size={17} />
            </button>
          ) : (
            <span className={cx('h-2 w-2 rounded-full sm:hidden', syncing ? 'animate-pulse bg-accent' : 'bg-transparent')} aria-hidden />
          )}
          <SyncBadge />
          {isAdmin && (
            <button onClick={logout} className="chip bg-accent text-on-accent hover:brightness-105" title="Keluar Mod Admin">
              <ShieldCheck size={13} /> Admin
            </button>
          )}
          <button className="btn-icon" onClick={toggle} aria-label={dark ? 'Mod cerah' : 'Mod gelap'}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile / tablet scrollable tab bar */}
      <nav ref={scroller} className="no-scrollbar mx-auto flex max-w-6xl gap-1.5 overflow-x-auto px-4 pb-3 sm:px-6 lg:hidden" aria-label="Seksyen utama">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <a
              key={t.id}
              data-tab={t.id}
              href={`#${t.id}`}
              onClick={() => setTab(t.id)}
              aria-current={active ? 'page' : undefined}
              className={cx(
                'flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition',
                active
                  ? 'border-transparent bg-brand text-on-brand dark:border-accent/50 dark:text-accent'
                  : 'border-line bg-surface text-muted',
              )}
            >
              <Icon size={15} strokeWidth={2} /> {t.label}
            </a>
          );
        })}
      </nav>
    </header>
  );
}
