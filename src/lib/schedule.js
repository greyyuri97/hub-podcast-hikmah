/**
 * LIST PANEL is the single source of truth for the podcast schedule.
 * UPCOMING PODCAST and the Hero Spotlight are *derived* from PANEL rows here —
 * there is no separate schedule to keep in sync.
 *
 * PANEL.tarikh is either an ISO date ('YYYY-MM-DD') or the literal 'Belum Ditentukan'.
 * Hari (day name) is always derived from the date, never stored, so it can't drift.
 */
import { daysUntil, formatTarikh, hariFromISO } from './utils.js';

export const TBD = 'Belum Ditentukan';

/** True when the value is a real calendar date (anything else = not yet decided). */
export const isDated = (t) => /^\d{4}-\d{2}-\d{2}/.test(String(t ?? '').trim());

/** 'Khamis, 3 Disember 2026' (or short: 'Khamis, 3 Dis 2026'), or 'Belum Ditentukan'. */
export function formatTarikhHari(t, { short = false } = {}) {
  if (!isDated(t)) return TBD;
  const iso = String(t).trim().slice(0, 10);
  return `${hariFromISO(iso)}, ${formatTarikh(iso, { short })}`;
}

/** ['A'] -> 'A'; ['A','B'] -> 'A & B'; ['A','B','C'] -> 'A, B & C' */
export function joinNames(names) {
  const n = names.filter(Boolean);
  if (n.length <= 1) return n[0] || '';
  return `${n.slice(0, -1).join(', ')} & ${n[n.length - 1]}`;
}

const key = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * PANEL rows (one per panelist) -> schedule slots (one per podcast).
 * Rows with the same date + same tajuk merge into one slot with all panelists.
 * Excludes 'Belum Ditentukan'; by default only today and later. Nearest date first.
 */
export function deriveSchedule(panelRows = [], { includePast = false } = {}) {
  const slots = new Map();
  for (const r of panelRows) {
    if (!isDated(r.tarikh)) continue;
    const tarikh = String(r.tarikh).trim().slice(0, 10);
    const n = daysUntil(tarikh);
    if (!includePast && (n === null || n < 0)) continue;
    const k = `${tarikh}|${key(r.tajuk)}`;
    if (!slots.has(k)) slots.set(k, { id: k, tarikh, hari: hariFromISO(tarikh), tajuk: String(r.tajuk || '').trim(), names: [], ids: [] });
    const s = slots.get(k);
    const name = String(r.nama_panel || '').trim();
    if (name && !s.names.some((x) => key(x) === key(name))) s.names.push(name);
    s.ids.push(r.id);
  }
  return [...slots.values()]
    .map((s) => ({ ...s, panel: joinNames(s.names) }))
    .sort((a, b) => a.tarikh.localeCompare(b.tarikh) || a.tajuk.localeCompare(b.tajuk));
}

/** Nearest upcoming slot (today or later) for the Hero Spotlight, or undefined. */
export const nextScheduled = (panelRows) => deriveSchedule(panelRows)[0];
