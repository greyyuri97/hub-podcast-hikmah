import { useMemo, useState } from 'react';
import { Play, PlaySquare } from 'lucide-react';
import { useData } from '../lib/store.jsx';
import { byOrder, formatTarikh, getYouTubeId, isUrl, ytThumb, ytWatch } from '../lib/utils.js';
import { StarPattern } from '../components/Pattern.jsx';
import { AddButton, ConfirmModal, Empty, FormModal, RowActions, SectionHeader, moved, useEditor } from '../components/ui.jsx';

function Thumb({ item, className = '' }) {
  const id = getYouTubeId(item.youtube_url);
  const custom = isUrl(item.custom_thumbnail) ? item.custom_thumbnail : '';
  // Demo seed IDs (CONTOH…) don't exist on YouTube: skip the request instead of logging 404s.
  const src = custom || (id && !/^CONTOH/.test(id) ? ytThumb(id) : '');
  const [failed, setFailed] = useState(false);
  const [lastSrc, setLastSrc] = useState(src);
  if (src !== lastSrc) { setLastSrc(src); setFailed(false); }

  return (
    <div className={`relative aspect-video overflow-hidden bg-brand ${className}`}>
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          onError={() => setFailed(true)}
          // YouTube serves a 120×90 grey placeholder for unknown IDs — treat as missing.
          onLoad={(e) => !custom && e.currentTarget.naturalWidth <= 120 && setFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-accent">
          <StarPattern id={`yt-${item.id}`} opacity={0.08} />
          <span className="relative line-clamp-3 px-6 text-center text-sm font-semibold text-on-brand/85 wrap-anywhere">{item.tajuk}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
      <span className="absolute bottom-3 left-3 grid h-11 w-11 place-items-center rounded-full bg-accent text-on-accent shadow-lg transition group-hover:scale-110">
        <Play size={17} fill="currentColor" className="translate-x-[1px]" />
      </span>
    </div>
  );
}

const FIELDS = [
  { name: 'tajuk', label: 'Tajuk Episod', required: true, placeholder: 'cth. EP13 · Mengurus Hati' },
  {
    name: 'youtube_url', label: 'Pautan YouTube', type: 'url', required: true,
    placeholder: 'https://youtu.be/… atau https://www.youtube.com/watch?v=…',
    help: 'Menyokong youtube.com/watch, youtu.be, /shorts, /live & /embed. Thumbnail dijana automatik.',
    preview: (v) => {
      const id = getYouTubeId(v.youtube_url);
      if (!v.youtube_url) return null;
      return id ? (
        <div className="mt-3 flex items-center gap-3 rounded-btn border border-line p-2">
          <img src={(isUrl(v.custom_thumbnail) && v.custom_thumbnail) || ytThumb(id, 'mqdefault')} alt="" className="h-12 w-20 rounded object-cover" />
          <span className="text-[13px] text-muted">ID video dikesan: <code className="font-semibold text-ink">{id}</code></span>
        </div>
      ) : (
        <p className="mt-2 text-[13px] font-medium text-danger">Pautan YouTube tidak dikenali.</p>
      );
    },
  },
  { name: 'custom_thumbnail', label: 'URL Thumbnail Tersuai (pilihan)', type: 'url', placeholder: 'https://…/gambar.jpg', help: 'Isi hanya jika mahu mengatasi thumbnail automatik YouTube.' },
  { name: 'tarikh', label: 'Tarikh Terbit (pilihan)', type: 'date' },
];

export default function Youtube() {
  const { db, isAdmin, create, update, remove, reorder, toast } = useData();
  const { editing, setEditing, deleting, setDeleting } = useEditor();
  const rows = useMemo(() => [...db.YOUTUBE].sort(byOrder), [db.YOUTUBE]);

  const save = (v) => {
    if (!getYouTubeId(v.youtube_url)) {
      toast('Pautan YouTube tidak sah', 'err');
      return false;
    }
    return editing?.id ? update('YOUTUBE', editing.id, v) : create('YOUTUBE', v);
  };

  return (
    <section aria-labelledby="h-youtube">
      <SectionHeader
        eyebrow="Arkib"
        title={<span id="h-youtube">Episode Podcast YT</span>}
        desc="Episod yang telah diterbitkan. Klik untuk tonton di YouTube."
        action={isAdmin && <AddButton onClick={() => setEditing({})}>Tambah Episod</AddButton>}
      />

      {rows.length === 0 ? (
        <Empty icon={PlaySquare} title="Belum ada episod" />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {rows.map((r, i) => {
            const id = getYouTubeId(r.youtube_url);
            return (
              <li key={r.id} className="card group flex flex-col overflow-hidden">
                <a href={id ? ytWatch(id) : r.youtube_url} target="_blank" rel="noopener noreferrer" className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent">
                  <Thumb item={r} />
                  <div className="flex flex-1 flex-col gap-1 p-4">
                    <h3 className="line-clamp-2 text-[17px] font-bold leading-snug text-ink wrap-anywhere group-hover:text-primary sm:text-base">{r.tajuk}</h3>
                    {r.tarikh && <p className="text-[13px] text-muted">{formatTarikh(r.tarikh)}</p>}
                  </div>
                </a>
                {isAdmin && (
                  <RowActions
                    className="justify-end border-t border-line px-1 py-0.5"
                    onUp={i > 0 ? () => reorder('YOUTUBE', moved(rows, i, -1)) : undefined}
                    onDown={i < rows.length - 1 ? () => reorder('YOUTUBE', moved(rows, i, 1)) : undefined}
                    onEdit={() => setEditing(r)}
                    onDelete={() => setDeleting(r)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      <FormModal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Episod' : 'Tambah Episod'} fields={FIELDS} initial={editing} onSubmit={save} />
      <ConfirmModal open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={() => remove('YOUTUBE', deleting.id)} message={`Padam “${deleting?.tajuk}”?`} />
    </section>
  );
}
