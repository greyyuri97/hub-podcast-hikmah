import { BookMarked, BookOpenCheck, CalendarDays, Lightbulb, MessageSquareQuote, PlaySquare, Users } from 'lucide-react';

export const TABS = [
  { id: 'upcoming', label: 'Upcoming', full: 'Upcoming Podcast', icon: CalendarDays },
  { id: 'panel', label: 'List Panel', full: 'List Panel', icon: Users },
  { id: 'panduan', label: 'Panduan', full: 'Panduan Panel', icon: BookOpenCheck },
  { id: 'peringatan', label: 'Peringatan', full: 'Peringatan Syeikhuna', icon: MessageSquareQuote },
  { id: 'kitab', label: 'Promosi Kitab', full: 'Promosi Kitab', icon: BookMarked },
  { id: 'youtube', label: 'Episod YT', full: 'Episode Podcast YT', icon: PlaySquare },
  { id: 'cadangan', label: 'Cadangan', full: 'Cadangan', icon: Lightbulb },
];
