export const HARI = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
export const BULAN = [
  'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
  'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember',
];
export const BULAN_PENDEK = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];

export const cx = (...a) => a.filter(Boolean).join(' ');

export const uid = (prefix = '') =>
  prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/** Local date -> 'YYYY-MM-DD' (no timezone shift). */
export function toISO(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 'YYYY-MM-DD' -> local Date (midnight). Accepts full ISO strings too. */
export function parseISO(s) {
  if (!s) return null;
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) {
    const d = new Date(s);
    return isNaN(d) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  return new Date(+m[1], +m[2] - 1, +m[3]);
}

export const todayISO = () => toISO(new Date());
export const addDays = (n, from = new Date()) => {
  const d = new Date(from);
  d.setDate(d.getDate() + n);
  return toISO(d);
};

/** Stored `hari`, or derived from the date when the sheet cell was left blank. */
export const hariOf = (r) => r?.hari || hariFromISO(r?.tarikh);

export function hariFromISO(s) {
  const d = parseISO(s);
  return d ? HARI[d.getDay()] : '';
}

export function formatTarikh(s, { short = false } = {}) {
  const d = parseISO(s);
  if (!d) return s || '';
  return `${d.getDate()} ${(short ? BULAN_PENDEK : BULAN)[d.getMonth()]} ${d.getFullYear()}`;
}

/** Whole days from today to date (negative = past). */
export function daysUntil(s) {
  const d = parseISO(s);
  if (!d) return null;
  const t = parseISO(todayISO());
  return Math.round((d - t) / 86400000);
}

export function relativeLabel(s) {
  const n = daysUntil(s);
  if (n === null) return '';
  if (n === 0) return 'Hari ini';
  if (n === 1) return 'Esok';
  if (n === -1) return 'Semalam';
  if (n > 1) return `${n} hari lagi`;
  return `${Math.abs(n)} hari lepas`;
}

/** Extract an 11-char YouTube video ID from any common URL shape (or a bare ID). */
export function getYouTubeId(url) {
  if (!url) return null;
  const s = String(url).trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s.startsWith('http') ? s : `https://${s}`);
    const host = u.hostname.replace(/^www\.|^m\.|^music\./, '');
    if (host === 'youtu.be') return valid(u.pathname.split('/')[1]);
    if (host.endsWith('youtube.com') || host === 'youtube-nocookie.com') {
      const v = u.searchParams.get('v');
      if (v) return valid(v);
      const m = u.pathname.match(/^\/(?:embed|shorts|live|v|e)\/([\w-]{11})/);
      if (m) return m[1];
    }
  } catch {
    /* fall through */
  }
  // (?![\w-]) => exactly 11 chars; never silently truncate a longer bogus id
  const m = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([\w-]{11})(?![\w-])/);
  return m ? m[1] : null;
}
const valid = (id) => (id && /^[\w-]{11}$/.test(id) ? id : null);

export const ytThumb = (id, q = 'hqdefault') => (id ? `https://i.ytimg.com/vi/${id}/${q}.jpg` : '');
export const ytWatch = (id) => `https://www.youtube.com/watch?v=${id}`;

export const isUrl = (s) => /^https?:\/\/\S+$/i.test(String(s || '').trim());

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;opacity:0;left:-9999px';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length); // iOS Safari
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

export const byOrder = (a, b) => (Number(a.order) || 0) - (Number(b.order) || 0);

export function storage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
export function store(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota / private mode */ }
}
