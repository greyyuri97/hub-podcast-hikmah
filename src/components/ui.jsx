import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Trash2, X, Plus, Inbox } from 'lucide-react';
import { cx } from '../lib/utils.js';

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  // Depend on `open` only: parents pass inline onClose, and re-running this effect
  // on every parent render would steal focus back to the first field mid-typing.
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const onKey = (e) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    setTimeout(() => ref.current?.querySelector('input,textarea,select,button')?.focus(), 30);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={ref}
        className={cx(
          'animate-fade-up relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[20px] border border-line bg-surface shadow-2xl sm:rounded-card',
          size === 'sm' ? 'sm:max-w-sm' : 'sm:max-w-lg',
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h3 className="text-base font-bold text-ink">{title}</h3>
          <button className="btn-icon -mr-2" onClick={onClose} aria-label="Tutup"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>
  );
}

/**
 * Generic form modal. fields: [{ name, label, type: text|textarea|date|url|number|select, required, placeholder, help, options, dir }]
 * onSubmit(values) -> truthy to close.
 */
export function FormModal({ open, onClose, title, fields, initial, onSubmit, submitLabel = 'Simpan', onChange }) {
  const [values, setValues] = useState({});
  const [busy, setBusy] = useState(false);
  const initRef = useRef(initial);
  initRef.current = initial;
  // Reset only when the modal opens (initial may be a fresh object each render).
  useEffect(() => { if (open) setValues({ ...(initRef.current || {}) }); }, [open]);

  const set = (name, v) =>
    setValues((cur) => {
      const next = { ...cur, [name]: v };
      return onChange ? onChange(next, name) : next;
    });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const ok = await onSubmit(values);
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>Batal</button>
          <button type="submit" form="form-modal" className="btn-gold" disabled={busy}>{busy ? 'Menyimpan…' : submitLabel}</button>
        </>
      }
    >
      <form id="form-modal" onSubmit={submit} className="space-y-4">
        {fields.map((f) => {
          const common = {
            id: `f-${f.name}`,
            name: f.name,
            required: f.required,
            placeholder: f.placeholder,
            value: values[f.name] ?? '',
            onChange: (e) => set(f.name, e.target.value),
            className: cx('input', f.dir === 'rtl' && 'arabic text-right text-lg'),
            dir: f.dir,
            maxLength: f.maxLength,
          };
          return (
            <div key={f.name}>
              <label className="label" htmlFor={common.id}>
                {f.label} {f.required && <span className="text-accent">*</span>}
              </label>
              {f.type === 'textarea' ? (
                <textarea rows={f.rows || 4} {...common} />
              ) : f.type === 'select' ? (
                <select {...common}>
                  {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input type={f.type || 'text'} min={f.min} {...common} />
              )}
              {f.help && <p className="mt-1.5 text-xs text-muted">{f.help}</p>}
              {f.preview && f.preview(values)}
            </div>
          );
        })}
      </form>
    </Modal>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title = 'Padam rekod?', message = 'Tindakan ini tidak boleh dibatalkan.' }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>Batal</button>
          <button className="btn bg-danger text-white hover:brightness-110" onClick={() => { onConfirm(); onClose(); }}>Padam</button>
        </>
      }
    >
      <p className="text-sm text-muted">{message}</p>
    </Modal>
  );
}

export function SectionHeader({ eyebrow, title, desc, action }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>}
        <h2 className="section-title">{title}</h2>
        {desc && <p className="mt-1.5 max-w-xl text-sm text-muted">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function AddButton({ onClick, children = 'Tambah' }) {
  return (
    <button className="btn-gold self-start sm:self-auto" onClick={onClick}>
      <Plus size={16} strokeWidth={2.4} /> {children}
    </button>
  );
}

/** Admin inline toolbar: edit / delete / move. */
export function RowActions({ onEdit, onDelete, onUp, onDown, className = '', tone = 'default' }) {
  const b = tone === 'onBrand' ? 'btn-icon text-on-brand/70 hover:bg-white/10 hover:text-on-brand' : 'btn-icon';
  return (
    <div className={cx('flex items-center gap-0.5', className)}>
      {onUp && <button className={b} onClick={onUp} aria-label="Naik"><ArrowUp size={16} /></button>}
      {onDown && <button className={b} onClick={onDown} aria-label="Turun"><ArrowDown size={16} /></button>}
      {onEdit && <button className={b} onClick={onEdit} aria-label="Edit"><Pencil size={16} /></button>}
      {onDelete && (
        <button className={cx(b, 'hover:!text-danger')} onClick={onDelete} aria-label="Padam"><Trash2 size={16} /></button>
      )}
    </div>
  );
}

export function Empty({ icon: Icon = Inbox, title = 'Tiada rekod', hint }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="mb-1 grid h-12 w-12 place-items-center rounded-full bg-accent/15 text-primary"><Icon size={22} strokeWidth={1.8} /></span>
      <p className="font-semibold text-ink">{title}</p>
      {hint && <p className="max-w-xs text-sm text-muted">{hint}</p>}
    </div>
  );
}

/** Reusable hook for edit/delete modals state. */
export function useEditor() {
  const [editing, setEditing] = useState(null); // null | {} (new) | row
  const [deleting, setDeleting] = useState(null);
  return { editing, setEditing, deleting, setDeleting };
}

/** Swap item with neighbour and return new id order. */
export function moved(list, index, dir) {
  const ids = list.map((x) => x.id);
  const j = index + dir;
  if (j < 0 || j >= ids.length) return null;
  [ids[index], ids[j]] = [ids[j], ids[index]];
  return ids;
}
