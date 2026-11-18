import { useCallback, useEffect, useRef, useState } from 'react';
import { Header } from './components/Header.jsx';
import { Hero } from './components/Hero.jsx';
import { Footer } from './components/Footer.jsx';
import { TABS } from './components/nav.js';
import { StarPattern } from './components/Pattern.jsx';
import { useData } from './lib/store.jsx';
import Upcoming from './sections/Upcoming.jsx';
import PanelList from './sections/PanelList.jsx';
import Panduan from './sections/Panduan.jsx';
import Peringatan from './sections/Peringatan.jsx';
import Kitab from './sections/Kitab.jsx';
import Youtube from './sections/Youtube.jsx';
import Cadangan from './sections/Cadangan.jsx';

const SECTIONS = { upcoming: Upcoming, panel: PanelList, panduan: Panduan, peringatan: Peringatan, kitab: Kitab, youtube: Youtube, cadangan: Cadangan };
const fromHash = () => {
  const h = window.location.hash.replace('#', '');
  return SECTIONS[h] ? h : 'upcoming';
};

export default function App() {
  const [tab, setTabState] = useState(fromHash);
  const contentRef = useRef(null);
  const { isAdmin, mode, hasData, error, syncing, refresh } = useData();

  useEffect(() => {
    const onHash = () => setTabState(fromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const setTab = useCallback((id, { scroll = false } = {}) => {
    setTabState(id);
    if (window.location.hash !== `#${id}`) history.replaceState(null, '', `#${id}`);
    if (scroll) requestAnimationFrame(() => contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, []);

  const Section = SECTIONS[tab];
  const title = TABS.find((t) => t.id === tab)?.full;
  useEffect(() => { document.title = `${title} · Hub Podcast Hikmah`; }, [title]);

  return (
    <div className="relative min-h-dvh">
      {/* page-wide watermark (gold, 4%) */}
      <div className="pointer-events-none fixed inset-0 -z-10 text-accent"><StarPattern id="page-star" opacity={0.04} /></div>

      <Header tab={tab} setTab={setTab} />

      {isAdmin && (
        <div className="border-b border-accent/30 bg-accent/15 text-center text-xs font-semibold text-ink">
          <p className="mx-auto max-w-6xl px-4 py-2">Mod Admin aktif — anda boleh tambah, edit, susun & padam semua kandungan.</p>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 sm:pt-8">
        <Hero goTo={(id) => setTab(id, { scroll: true })} />
        <div ref={contentRef} className="scroll-mt-32 pt-10 sm:pt-12 lg:scroll-mt-24">
          {hasData ? (
            <div key={tab} className="animate-fade-up">
              <Section />
            </div>
          ) : error && !syncing ? (
            <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
              <p className="font-semibold text-ink">Tidak dapat memuatkan data</p>
              <p className="max-w-sm text-sm text-muted">{error}</p>
              <button className="btn-gold" onClick={() => refresh({ silent: false })}>Cuba lagi</button>
            </div>
          ) : (
            <div className="space-y-4" aria-busy="true" aria-label="Memuatkan">
              <div className="h-7 w-48 animate-pulse rounded bg-line" />
              <div className="grid gap-4 md:grid-cols-2">
                {[0, 1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-card bg-line/70" />)}
              </div>
            </div>
          )}
        </div>
        {mode === 'mock' && (
          <p className="mt-10 rounded-btn border border-dashed border-line px-4 py-3 text-center text-xs text-muted">
            Mod Demo: data disimpan dalam pelayar ini sahaja. Sambungkan Google Apps Script di <code>src/config.js</code> untuk segerak merentas peranti.
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
}
