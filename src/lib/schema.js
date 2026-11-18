/**
 * Single source of truth for sheet names & columns.
 * MUST match HEADERS in google-apps-script/Code.gs.
 */
export const SHEETS = {
  UPCOMING: ['id', 'order', 'hari', 'tarikh', 'masa', 'tajuk', 'panel'],
  PANEL: ['id', 'tajuk', 'nama_panel', 'tarikh'],
  PANDUAN: ['id', 'order', 'kategori', 'tajuk', 'keterangan', 'gdrive_url'],
  PERINGATAN: ['id', 'order', 'petikan', 'arab', 'konteks'],
  KITAB: ['id', 'nama_kitab', 'bilangan'],
  YOUTUBE: ['id', 'order', 'tajuk', 'youtube_url', 'custom_thumbnail', 'tarikh'],
  CADANGAN: ['id', 'tarikh', 'catatan', 'status', 'balasan_admin', 'created_at'],
};

export const PANDUAN_KATEGORI = { PANEL: 'PANEL', SKRIP: 'SKRIP_PROMOSI' };
export const STATUS = { BELUM: 'BELUM', SELESAI: 'SELESAI' };

export const emptyDB = () =>
  Object.fromEntries(Object.keys(SHEETS).map((k) => [k, []]));
