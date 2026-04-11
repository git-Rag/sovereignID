import { useState, useCallback } from 'react';
import { Check } from 'lucide-react';
import { QRScanner } from '../components/QRScanner';

export function VerifyPage() {
  const [open, setOpen] = useState(false);

  const handleDidResolved = useCallback(() => {
    setOpen(true);
  }, []);

  return (
    <div className="verify-page">
      <h1 className="verify-page__title">Verify Identity</h1>
      <p className="verify-page__sub">Scan a refugee&apos;s proof QR to verify</p>

      <QRScanner onDidResolved={handleDidResolved} />

      <div className="verify-sim">
        <button type="button" className="btn-secondary" onClick={() => setOpen(true)}>
          Simulate successful scan
        </button>
      </div>

      {open && (
        <>
          <button
            type="button"
            className="verify-sheet-overlay verify-sheet-overlay--open"
            aria-label="Close verification result"
            onClick={() => setOpen(false)}
          />
          <aside className="verify-sheet verify-sheet--open">
            <div className="verify-sheet__check">
              <Check size={40} strokeWidth={1.5} aria-hidden />
            </div>
            <h2 className="verify-sheet__title">Verified</h2>
            <div className="verify-sheet__row">
              <span>Claim</span>
              <span>Age over 18</span>
            </div>
            <div className="verify-sheet__row">
              <span>Value</span>
              <span>true</span>
            </div>
            <div className="verify-sheet__row">
              <span>Issuer</span>
              <span>NGO Refugee Support</span>
            </div>
            <p className="verify-sheet__foot">No personal data was received in this verification</p>
          </aside>
        </>
      )}
    </div>
  );
}
