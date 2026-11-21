import { useMemo, useState } from 'react';
import { CalendarClock, CalendarDays, Search, UserRound, Users, X } from 'lucide-react';
import { useData } from '../lib/store.jsx';
import { cx, daysUntil, relativeLabel } from '../lib/utils.js';
import { TBD, formatTarikhHari, isDated } from '../lib/schedule.js';
import { AddButton, ConfirmModal, Empty, FormModal, RowActions, SectionHeader, useEditor } from '../components/ui.jsx';

/** Live preview under the date field: the derived Bahasa Melayu day + full date. */
function HariPreview({ values }) {
  if (values.tbd) {
    return <p className="mt-2 text-[13px] font-medium text-muted">Tidak akan dipaparkan di Upcoming sehingga tarikh ditetapkan.</p>;
  }
  if (!isDated(values.tarikh)) return null;
  const n = daysUntil(values.tarikh);
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-btn bg-brand/5 px-3 py-2 text-[13px] dark:bg-accent/10">
      <CalendarDays size={15} className="shrink-0 text-primary" />
      <span className="font-semibold text-ink" data-testid="hari-preview">{formatTarikhHari(values.tarikh)}</span>
      {n !== null && <span className="text-muted">· {n < 0 ? 'Telah berlalu (arkib)' : `${relativeLabel(values.tarikh)} · dipaparkan di Upcoming`}</span>}
    </p>
  );
}

const FIELDS = [
  { name: 'tajuk', label: 'Tajuk', required: true, placeholder: 'Tajuk episod' },
  {
    name: 'nama_panel', label: 'Nama Panel', required: true, placeholder: 'cth. Ustaz Hafiz Rahman',
    help: 'Satu rekod bagi setiap panel. Panel dengan tajuk & tarikh yang sama digabungkan dalam satu slot Upcoming.',
  },
  {
    name: 'tarikh', label: 'Tarikh', type: 'date',
    requiredWhen: (v) => !v.tbd,
    disabledWhen: (v) => Boolean(v.tbd),
    preview: (v) => <HariPreview values={v} />,
  },
  { name: 'tbd', label: 'Belum Ditentukan', type: 'checkbox', help: 'Tandakan jika tarikh rakaman belum ditetapkan.' },
];

const norm = (s) => String(s || '').toLowerCase().normalize('NFKD');

/** Upcoming (nearest first) -> Belum Ditentukan -> past (most recent first). */
function rank(r) {
  if (!isDated(r.tarikh)) return 1;
  const n = daysUntil(r.tarikh);
  return n !== null && n >= 0 ? 0 : 2;
}

function DateLine({ tarikh }) {
  if (!isDated(tarikh)) {
    return (
      <span className="chip mt-1.5 border border-dashed border-muted/50 bg-transparent text-muted">
        <CalendarClock size={13} /> {TBD}
      </span>
    );
  }
  const n = daysUntil(tarikh);
  const future = n !== null && n >= 0;
  return (
    <p className={cx('mt-1 flex flex-wrap items-center gap-x-1.5 text-[13px] font-medium', future ? 'text-primary' : 'text-muted')}>
      <CalendarDays size={14} className="shrink-0" />
      <span>{formatTarikhHari(tarikh, { short: true })}</span>
      {future && <span className="font-normal text-muted">· {relativeLabel(tarikh)}</span>}
    </p>
  );
}

export default function PanelList() {
  const { db, isAdmin, create, update, remove, toast } = useData();
  const { editing, setEditing, deleting, setDeleting } = useEditor();
  const [q, setQ] = useState('');
  const [when, setWhen] = useState('semua');

  const rows = useMemo(() => {
    const term = norm(q).trim();
    return [...db.PANEL]
      .filter((r) => !term || norm(`${r.tajuk} ${r.nama_panel}`).includes(term))
      .filter((r) => {
        if (when === 'semua') return true;
        const k = rank(r);
        return when === 'akan' ? k <= 1 : k === 2; // "Akan datang" includes Belum Ditentukan
      })
      .sort((a, b) => {
        const ra = rank(a);
        const rb = rank(b);
        if (ra !== rb) return ra - rb;
        const da = String(a.tarikh || '');
        const db_ = String(b.tarikh || '');
        const byDate = ra === 0 ? da.localeCompare(db_) : db_.localeCompare(da);
        return byDate || norm(a.tajuk).localeCompare(norm(b.tajuk));
      });
  }, [db.PANEL, q, when]);

  const openEditor = (r) =>
    setEditing(
      r?.id
        ? { ...r, tarikh: isDated(r.tarikh) ? String(r.tarikh).slice(0, 10) : '', tbd: !isDated(r.tarikh) }
        : { tbd: false },
    );

  const save = async (v) => {
    if (!v.tbd && !isDated(v.tarikh)) {
      toast('Sila pilih tarikh atau tandakan "Belum Ditentukan"', 'err');
      return false;
    }
    // Only the sheet columns go to the backend; `tbd` is UI state.
    const item = { tajuk: String(v.tajuk || '').trim(), nama_panel: String(v.nama_panel || '').trim(), tarikh: v.tbd ? TBD : v.tarikh };
    const n = v.tbd ? null : daysUntil(v.tarikh);
    const msg = v.tbd
      ? 'Panel disimpan · tarikh belum ditentukan'
      : n !== null && n >= 0 ? 'Panel disimpan · dipaparkan di Upcoming' : 'Panel disimpan (arkib)';
    return editing?.id ? update('PANEL', editing.id, item, msg) : create('PANEL', item, msg);
  };

  return (
    <section aria-labelledby="h-panel">
      <SectionHeader
        eyebrow="Direktori & Jadual"
        title={<span id="h-panel">List Panel</span>}
        desc={
          isAdmin
            ? 'Sumber utama jadual: panel yang bertarikh dipaparkan secara automatik di Upcoming Podcast.'
            : 'Arkib tajuk dan panel — semak siapa pernah atau akan menjadi panel.'
        }
        action={isAdmin && <AddButton onClick={() => openEditor(null)}>Tambah Panel</AddButton>}
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Cari panel atau tajuk</span>
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input type="search" enterKeyHint="search" className="input bg-surface pl-10 pr-12" placeholder="Cari nama panel atau tajuk…" value={q} onChange={(e) => setQ(e.target.value)} />
          {q && (
            <button className="btn-icon absolute right-0 top-1/2 -translate-y-1/2" onClick={() => setQ('')} aria-label="Kosongkan carian"><X size={17} /></button>
          )}
        </label>
        <div className="segmented" role="tablist" aria-label="Tapis masa">
          {[['semua', 'Semua'], ['akan', 'Akan datang'], ['lepas', 'Lepas']].map(([v, l]) => (
            <button key={v} role="tab" aria-selected={when === v} onClick={() => setWhen(v)}
              className={cx('segment sm:px-3', when === v ? 'bg-brand text-on-brand dark:text-accent' : 'text-muted hover:text-ink')}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-3 text-[13px] font-medium text-muted">{rows.length} rekod</p>

      {rows.length === 0 ? (
        <Empty icon={Users} title={q ? 'Tiada padanan' : 'Tiada rekod panel'} hint={q ? `Tiada keputusan untuk “${q}”.` : undefined} />
      ) : (
        <ul className="card divide-y divide-line overflow-hidden">
          {rows.map((r) => (
            <li key={r.id} data-panel-id={r.id} className={cx('flex min-h-[72px] items-center gap-3 px-4 py-3 sm:gap-3.5 sm:px-5', rank(r) === 2 && 'opacity-80')}>
              <span className="grid h-10 w-10 shrink-0 place-items-center self-start rounded-full bg-brand/10 text-primary dark:bg-accent/15 sm:self-center"><UserRound size={18} /></span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-semibold leading-snug text-ink wrap-anywhere">{r.nama_panel}</p>
                <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-muted wrap-anywhere">{r.tajuk}</p>
                <DateLine tarikh={r.tarikh} />
              </div>
              {isAdmin && <RowActions onEdit={() => openEditor(r)} onDelete={() => setDeleting(r)} />}
            </li>
          ))}
        </ul>
      )}

      <FormModal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Panel' : 'Tambah Panel'} fields={FIELDS} initial={editing} onSubmit={save} />
      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => remove('PANEL', deleting.id)}
        message={`Padam ${deleting?.nama_panel} daripada senarai?${isDated(deleting?.tarikh) ? ' Slot ini juga akan dikeluarkan dari Upcoming.' : ''}`}
      />
    </section>
  );
}
