import { useEffect, useState } from 'react';
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
      className={cx('hidden min-h-11 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium hover:bg-ink/5 sm:inline-flex', tone)}
    >
      {icon}<span className={cx('whitespace-nowrap', !error && 'lg:hidden 2xl:inline')}>{text}</span>
      {mode === 'mock' && <span className="ml-1 rounded-full bg-accent/20 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink">Demo</span>}
    </button>
  );
}

export function Header({ tab, setTab }) {
  const [dark, toggle] = useTheme();
  const { isAdmin, logout, syncing, error, refresh } = useData();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md supports-[backdrop-filter]:bg-bg/75">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 sm:px-6 lg:gap-3 lg:py-3">
        <a href="#upcoming" onClick={() => setTab('upcoming')} className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-btn">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] bg-brand text-accent dark:border dark:border-accent/40">
            <Star8 className="h-5 w-5" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[15px] font-extrabold tracking-tight text-ink">HUB PODCAST HIKMAH</span>
            <span className="block truncate text-xs font-medium text-muted">Pusat maklumat panel & moderator</span>
          </span>
        </a>

        {/* Desktop navigation (mobile/tablet uses the bottom tab bar) */}
        <nav className="ml-auto hidden items-center gap-0.5 lg:flex" aria-label="Seksyen utama">
          {TABS.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
              className={cx(
                'flex min-h-11 items-center whitespace-nowrap rounded-btn px-2.5 text-[13px] font-semibold transition xl:px-3',
                tab === t.id ? 'bg-brand text-on-brand dark:text-accent dark:ring-1 dark:ring-accent/40' : 'text-muted hover:bg-ink/5 hover:text-ink',
              )}
            >
              {t.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center lg:ml-2">
          {error && !syncing ? (
            <button className="btn-icon text-accent sm:hidden" onClick={() => refresh({ silent: false })} aria-label="Luar talian — cuba segerak semula">
              <CloudOff size={19} />
            </button>
          ) : (
            <span className={cx('mx-1 h-2 w-2 rounded-full sm:hidden', syncing ? 'animate-pulse bg-accent' : 'bg-transparent')} aria-hidden />
          )}
          <SyncBadge />
          {isAdmin && (
            <button onClick={logout} className="hit px-1" title="Keluar Mod Admin" aria-label="Keluar Mod Admin">
              <span className="chip bg-accent py-1.5 text-on-accent hover:brightness-105"><ShieldCheck size={14} /> Admin</span>
            </button>
          )}
          <button className="btn-icon" onClick={toggle} aria-label={dark ? 'Mod cerah' : 'Mod gelap'}>
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
