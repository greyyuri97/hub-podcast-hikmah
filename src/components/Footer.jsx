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
          className="input text-center text-xl tracking-[0.5em]"
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
        <button className="btn-gold w-full" disabled={busy || !pin}>{busy ? 'Menyemak…' : 'Buka Kunci'}</button>
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
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center sm:px-6">
        <Star8 className="h-5 w-5 text-accent" />
        <p className="max-w-md text-xs text-muted">
          Hub rujukan bersama untuk penganjur, moderator dan panel. Kongsi pautan ini — tak perlu ulang penerangan dalam group WhatsApp lagi.
        </p>
        <div className="flex items-center gap-1.5">
          <button onClick={onTap} className="select-none text-xs text-muted/80" aria-label="Hak cipta">
            © {new Date().getFullYear()} {CONFIG.ORG_NAME}
          </button>
          <button
            onClick={() => (isAdmin ? logout() : setOpen(true))}
            className="rounded p-1 text-muted/40 transition hover:text-muted"
            aria-label={isAdmin ? 'Keluar Mod Admin' : 'Log masuk Admin'}
            title={isAdmin ? 'Keluar Mod Admin' : 'Admin'}
          >
            {isAdmin ? <LockOpen size={12} /> : <Lock size={12} />}
          </button>
        </div>
      </div>
      <AdminPinModal open={open} onClose={() => setOpen(false)} />
    </footer>
  );
}
