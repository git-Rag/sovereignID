/**
 * Identity Display Page — Post-Enrollment QR & Identity View
 *
 * Shows the user's identity QR code and information after successful enrollment.
 * Includes a reset button to clear enrollment and start over.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { RotateCcw, CheckCircle2 } from 'lucide-react';
import { getDIDDocument } from '../lib/config';
import { useToast } from '../context/ToastContext';
import '../styles/identity-display.css';

export function IdentityDisplayPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [identity, setIdentity] = useState<Record<string, unknown> | null>(null);
  const [did, setDid] = useState<string>('');
  const [guardiansCount, setGuardiansCount] = useState<number>(5);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const doc = await getDIDDocument();
        if (cancelled) return;

        const id = typeof doc?.id === 'string' ? doc.id : '';
        setDid(id);

        // Create identity object for QR code
        const identityData = {
          did: id,
          timestamp: new Date().toISOString(),
        };
        setIdentity(identityData);

        // Load guardian count from localStorage
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('guardiansCount');
          if (saved) {
            setGuardiansCount(parseInt(saved, 10));
          }
        }
      } catch (error) {
        console.error('[IdentityDisplay] Failed to load identity:', error);
        if (!cancelled) {
          showToast('Failed to load identity');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const handleReset = async () => {
    try {
      setLoading(true);
      // Clear all enrollment-related data from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('isEnrolled');
        localStorage.removeItem('guardiansCount');
        // Clear common localStorage keys related to enrollment
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (
            key &&
            (key.startsWith('identity-') ||
              key.startsWith('shares-') ||
              key.startsWith('solana-tx-') ||
              key.startsWith('solana-explorer-url-'))
          ) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      }
      showToast('Identity reset. Reloading app...');
      // Reload the app after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('[IdentityDisplay] Reset failed:', error);
      showToast('Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-pad page-enter">
      <div className="flex-between mb-4">
        <h1 className="page-title">Your Identity</h1>
        <button
          type="button"
          className="icon-btn"
          onClick={handleReset}
          disabled={loading}
          title="Reset identity and reenroll"
          aria-label="Reset identity"
        >
          <RotateCcw size={20} strokeWidth={1.5} />
        </button>
      </div>

      <section className="identity-hero stagger">
        <div className="identity-success-state">
          <CheckCircle2 size={48} strokeWidth={1.5} color="var(--success)" className="mb-4" aria-hidden />
          <p className="identity-label">Enrollment Complete</p>
          <p className="identity-subtitle">Your identity is now sealed and protected</p>
        </div>
      </section>

      <section className="identity-qr-section stagger">
        <p className="identity-qr-label">Share your identity</p>
        <p className="identity-qr-sublabel">Anyone can verify you by scanning this QR code</p>

        {identity ? (
          <div className="identity-qr-box">
            <div className="identity-qr-wrapper">
              <QRCodeSVG
                value={JSON.stringify(identity)}
                size={200}
                level="M"
                bgColor="#ffffff"
                fgColor="#111118"
              />
            </div>
          </div>
        ) : (
          <div className="card">
            <p className="text-center">Loading your identity...</p>
          </div>
        )}

        {identity && did && (
          <div className="identity-info-card">
            <p className="identity-did-label">Your DID</p>
            <p className="identity-did-value font-mono">{did}</p>
          </div>
        )}
      </section>

      <section className="identity-guardians stagger">
        <div className="identity-guardian-box">
          <p className="identity-guardian-count">{guardiansCount} guardians assigned</p>
          <p className="identity-guardian-text">
            Any 3 guardians can help you recover your identity if you lose access to this device.
          </p>
        </div>
      </section>

      <section className="identity-actions stagger">
        <button type="button" className="btn-primary" onClick={() => navigate('/home')}>
          Go to Home
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleReset}
          disabled={loading}
        >
          {loading ? 'Resetting…' : 'Reset Identity'}
        </button>
      </section>
    </div>
  );
}
