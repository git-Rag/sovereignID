import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  Check,
  Landmark,
  QrCode,
  RotateCcw,
} from 'lucide-react';
import { getAppState, getDIDDocument } from '../lib/config';
import type { AppState } from '../lib/config';
import { useOnline } from '../hooks/useOnline';

function greetingPeriod(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export function HomePage() {
  const navigate = useNavigate();
  const { isOnline, lastOnline } = useOnline();
  const [state, setState] = useState<AppState | null>(null);
  const [did, setDid] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getAppState();
        const doc = await getDIDDocument();
        if (cancelled) return;
        setState(s);
        const id = typeof doc?.id === 'string' ? doc.id : '';
        setDid(id);
        if (id) {
          const alnum = id.replace(/[^a-zA-Z0-9]/g, '');
          const ini = (alnum.slice(-2) || 'RF').toUpperCase();
          localStorage.setItem('sovereignid_initials', ini);
          window.dispatchEvent(new Event('sovereignid-identity-updated'));
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const enrolled = Boolean(state?.enrolled);
  const name = enrolled ? 'Amira' : 'Refugee';
  const didLine =
    enrolled && did
      ? `did:key:···${did.slice(-12)}`
      : 'did:key:···complete setup to generate your DID';

  const guardianCount = state?.guardians?.length ?? 0;
  const guardianLabel = guardianCount >= 5 ? '5 assigned' : `${guardianCount} assigned`;

  const lastSync =
    isOnline
      ? 'Just now'
      : lastOnline
        ? new Date(lastOnline).toLocaleString()
        : 'Offline';

  return (
    <div className="page-enter">
      {!enrolled && (
        <div className="home-banner">
          Finish enrollment to activate your identity vault.
          <button type="button" className="home-banner__btn" onClick={() => navigate('/enrollment')}>
            Continue setup
          </button>
        </div>
      )}

      <section className="home-hero stagger">
        <p className="home-hero__label">Your identity</p>
        <h1 className="home-hero__greet">
          Good {greetingPeriod()}, {name}
        </h1>
        <p className="home-hero__did font-mono">{didLine}</p>
      </section>

      <section className="home-status stagger">
        <div className="home-status__grid">
          <div>
            <p className="home-status__label">Identity status</p>
            <p className={`home-status__value ${enrolled ? 'home-status__value--success' : ''}`}>
              {isOnline && <span className="home-status__dot home-status__dot--pulse" aria-hidden />}
              {!isOnline && <span className="home-status__dot" aria-hidden />}
              {enrolled ? 'Active' : 'Pending'}
            </p>
          </div>
          <div>
            <p className="home-status__label">Guardians</p>
            <p className="home-status__value">{guardianLabel}</p>
          </div>
        </div>
        <div className="home-status__divider">
          <p className="home-status__sync-label">Last synced</p>
          <p className="home-status__sync-val">{lastSync}</p>
        </div>
      </section>

      <section className="home-actions stagger" aria-label="Quick actions">
        <button type="button" className="home-tile" onClick={() => navigate('/share')}>
          <div className="home-tile__ic">
            <QrCode size={18} strokeWidth={1.5} />
          </div>
          <span className="home-tile__label">Share ID</span>
          <span className="home-tile__sub">Show your QR</span>
        </button>
        <button type="button" className="home-tile" onClick={() => navigate('/recovery')}>
          <div className="home-tile__ic">
            <RotateCcw size={18} strokeWidth={1.5} />
          </div>
          <span className="home-tile__label">Recover</span>
          <span className="home-tile__sub">Lost your phone?</span>
        </button>
        <button type="button" className="home-tile" onClick={() => navigate('/wallet?tab=credentials')}>
          <div className="home-tile__ic">
            <BadgeCheck size={18} strokeWidth={1.5} />
          </div>
          <span className="home-tile__label">Credentials</span>
          <span className="home-tile__sub">View your proofs</span>
        </button>
        <button type="button" className="home-tile" onClick={() => navigate('/wallet?tab=transactions')}>
          <div className="home-tile__ic">
            <Landmark size={18} strokeWidth={1.5} />
          </div>
          <span className="home-tile__label">Get Aid</span>
          <span className="home-tile__sub">Receive funds</span>
        </button>
      </section>

      <section className="home-creds stagger">
        <div className="home-creds__head">
          <h2 className="home-creds__title">Credentials</h2>
          <button type="button" className="home-creds__link" onClick={() => navigate('/wallet?tab=credentials')}>
            See all
          </button>
        </div>
        <div className="home-creds__row">
          <div className="home-chip">
            <Check size={14} strokeWidth={1.5} color="var(--success)" aria-hidden />
            <span className="home-chip__label">Age check</span>
            <span className="home-chip__ok" aria-hidden>
              ✓
            </span>
          </div>
          <div className="home-chip">
            <Check size={14} strokeWidth={1.5} color="var(--success)" aria-hidden />
            <span className="home-chip__label">Biometric ID</span>
            <span className="home-chip__ok" aria-hidden>
              ✓
            </span>
          </div>
          <div className="home-chip">
            <span className="home-chip__label">Refugee status</span>
            <span className="home-chip__pending" aria-hidden>
              …
            </span>
          </div>
        </div>
      </section>

      <section className="home-aid stagger">
        <p className="home-aid__label">Available balance</p>
        <div className="home-aid__amt">
          $0.00<span className="home-aid__cur">USDC</span>
        </div>
        <div className="home-aid__row">
          <button type="button" className="home-aid__btn">
            Withdraw to M-Pesa
          </button>
          <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden />
        </div>
      </section>
    </div>
  );
}
