import { Download, ExternalLink, FileText } from 'lucide-react';
import { cx } from '../lib/utils.js';
import { RowActions } from './ui.jsx';

export function driveId(url) {
  const s = String(url || '');
  const m = s.match(/\/d\/([\w-]{10,})/) || s.match(/[?&]id=([\w-]{10,})/);
  return m ? m[1] : null;
}
export function driveDownload(url) {
  const id = driveId(url);
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : url;
}

export function DriveCard({ item, isAdmin, onEdit, onDelete, onUp, onDown, featured = false }) {
  const hasUrl = Boolean(item.gdrive_url);
  return (
    <article
      className={cx(
        'relative flex h-full flex-col gap-4 rounded-card border p-5 shadow-soft',
        featured ? 'border-transparent bg-brand text-on-brand dark:border-accent/30' : 'border-line bg-surface',
      )}
    >
      <div className="flex items-start gap-3.5">
        <span className={cx('grid h-11 w-11 shrink-0 place-items-center rounded-btn', featured ? 'bg-white/10 text-accent' : 'bg-accent/15 text-primary')}>
          <FileText size={21} strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cx('mb-0.5 text-[10px] font-bold uppercase tracking-[0.16em]', featured ? 'text-accent' : 'text-muted')}>PDF · Google Drive</p>
          <h3 className="font-bold leading-snug">{item.tajuk}</h3>
        </div>
        {isAdmin && <RowActions tone={featured ? 'onBrand' : 'default'} onUp={onUp} onDown={onDown} onEdit={onEdit} onDelete={onDelete} />}
      </div>
      {item.keterangan && <p className={cx('text-sm leading-relaxed', featured ? 'text-on-brand/80' : 'text-muted')}>{item.keterangan}</p>}
      <div className="mt-auto flex gap-2">
        {hasUrl ? (
          <>
            <a className="btn-gold flex-1" href={driveDownload(item.gdrive_url)} target="_blank" rel="noopener noreferrer">
              <Download size={16} /> Muat Turun PDF
            </a>
            <a
              className={cx('btn border', featured ? 'border-white/20 text-on-brand hover:bg-white/10' : 'border-line text-ink hover:bg-ink/5')}
              href={item.gdrive_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Lihat ${item.tajuk}`}
            >
              <ExternalLink size={16} /> <span className="hidden sm:inline">Lihat</span>
            </a>
          </>
        ) : (
          <span className="text-sm italic opacity-70">Pautan belum ditetapkan</span>
        )}
      </div>
    </article>
  );
}

export const DRIVE_FIELDS = [
  { name: 'tajuk', label: 'Tajuk', required: true, placeholder: 'cth. Panduan Lengkap Panel' },
  { name: 'keterangan', label: 'Keterangan Ringkas', type: 'textarea', rows: 3, placeholder: 'Apa yang terkandung dalam dokumen ini?' },
  {
    name: 'gdrive_url', label: 'Pautan Google Drive (PDF)', type: 'url', required: true,
    placeholder: 'https://drive.google.com/file/d/…/view',
    help: 'Pastikan perkongsian fail ditetapkan kepada “Sesiapa yang mempunyai pautan”.',
  },
];
