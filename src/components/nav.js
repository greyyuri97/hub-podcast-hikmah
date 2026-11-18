import { BookMarked, BookOpenCheck, CalendarDays, Lightbulb, MessageSquareQuote, PlaySquare, Users } from 'lucide-react';

/** `short` = bottom tab bar label (must fit ~72px at 12px). `desc` = "Lagi" sheet subtitle. */
export const TABS = [
  { id: 'upcoming', label: 'Upcoming', short: 'Upcoming', full: 'Upcoming Podcast', icon: CalendarDays, desc: 'Jadual rakaman & siaran' },
  { id: 'panel', label: 'List Panel', short: 'Panel', full: 'List Panel', icon: Users, desc: 'Direktori panel & tajuk' },
  { id: 'panduan', label: 'Panduan', short: 'Panduan', full: 'Panduan Panel', icon: BookOpenCheck, desc: 'Dokumen PDF untuk panel' },
  { id: 'peringatan', label: 'Peringatan', short: 'Peringatan', full: 'Peringatan Syeikhuna', icon: MessageSquareQuote, desc: 'Adab & nasihat Tuan Syeikh' },
  { id: 'kitab', label: 'Promosi Kitab', short: 'Kitab', full: 'Promosi Kitab', icon: BookMarked, desc: 'Kekerapan promosi & skrip' },
  { id: 'youtube', label: 'Episod YT', short: 'Episod', full: 'Episode Podcast YT', icon: PlaySquare, desc: 'Galeri episod YouTube' },
  { id: 'cadangan', label: 'Cadangan', short: 'Cadangan', full: 'Cadangan', icon: Lightbulb, desc: 'Kongsi idea penambahbaikan' },
];

/** Phones show these 4 + "Lagi"; tablets (md) show all 7. */
export const PRIMARY = ['upcoming', 'panel', 'panduan', 'cadangan'];
