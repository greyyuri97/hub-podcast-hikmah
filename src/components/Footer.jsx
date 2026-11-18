import { useRef, useState } from 'react';
import { Lock, LockOpen } from 'lucide-react';
import { useData } from '../lib/store.jsx';
import { CONFIG } from '../config.js';
import { Modal } from './ui.jsx';
import { Star8 } from './Pattern.jsx';

function AdminPinModal({ open, onClose }) {
  const { login, mode } = useData();
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await login(pin.trim());
      setPin('');
      onClose();
    } catch (e2) {
      setErr(e2.message === 'PIN salah' ? 'PIN tidak sah. Sila cuba lagi.' : e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Akses Admin" size="sm">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-muted">Masukkan PIN Admin untuk mengurus semua kandungan hub.</p>
        <input
          className="input min-h-12 text-center text-xl tracking-[0.5em]"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          placeholder="••••"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          aria-label="PIN Admin"
          required
        />
        {err && <p className="text-sm font-medium text-danger">{err}</p>}
        {mode === 'mock' && <p className="text-xs text-muted">Mod demo: PIN lalai ialah <b>{CONFIG.MOCK_ADMIN_PIN}</b> (ubah di <code>src/config.js</code>).</p>}
        <button className="btn-gold min-h-12 w-full text-base sm:text-sm" disabled={busy || !pin}>{busy ? 'Menyemak…' : 'Buka Kunci'}</button>
      </form>
    </Modal>
  );
}

export function Footer() {
  const { isAdmin, logout } = useData();
  const [open, setOpen] = useState(false);
  const taps = useRef([]);

  const onTap = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 2500), now];
    if (taps.current.length >= 5) {
      taps.current = [];
      isAdmin ? logout() : setOpen(true);
    }
  };

  return (
    <footer className="mt-12 border-t border-line sm:mt-16">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 pb-4 pt-7 text-center sm:px-6 sm:py-8">
        <Star8 className="h-5 w-5 text-accent" />
        <p className="max-w-md text-[13px] leading-relaxed text-muted">
          Hub rujukan bersama untuk penganjur, moderator dan panel. Kongsi pautan ini — tak perlu ulang penerangan dalam group WhatsApp lagi.
        </p>
        <div className="flex items-center">
          <button onClick={onTap} className="min-h-11 select-none px-2 text-[13px] text-muted/80" aria-label="Hak cipta">
            © {new Date().getFullYear()} {CONFIG.ORG_NAME}
          </button>
          <button
            onClick={() => (isAdmin ? logout() : setOpen(true))}
            className="grid h-11 w-11 place-items-center rounded-btn text-muted/40 transition hover:text-muted"
            aria-label={isAdmin ? 'Keluar Mod Admin' : 'Log masuk Admin'}
            title={isAdmin ? 'Keluar Mod Admin' : 'Admin'}
          >
            {isAdmin ? <LockOpen size={14} /> : <Lock size={14} />}
          </button>
        </div>
      </div>
      <AdminPinModal open={open} onClose={() => setOpen(false)} />
    </footer>
  );
}
