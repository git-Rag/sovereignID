/**
 * Recovery UI — QR + guardian approvals (offline-first)
 */

import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Bluetooth, QrCode, Shield } from 'lucide-react';

export function RecoveryFlow() {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState(0);

  return (
    <div className="page-pad">
      <div className="text-center mb-6">
        <div className="flex-center mb-3">
          <Shield size={40} strokeWidth={1.5} color="var(--accent-mid)" aria-hidden />
        </div>
        <h1 className="page-title u-mb-2">Identity recovery</h1>
        <p className="page-sub u-mb-0">Guardian quorum reconstruction (3-of-5)</p>
      </div>

      <section className="mb-6">
        <h2 className="recovery-section-title">Recovery QR</h2>
        <p className="page-sub">Present this token to guardians for signed approval.</p>
        <div className="card recovery-qr-placeholder">
          <QrCode size={48} strokeWidth={1.5} color="var(--text-muted)" aria-hidden />
          <p className="recovery-qr-hint">
            Recovery payload bound to DID
            <br />
            (QR render)
          </p>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="recovery-section-title">Guardian approvals</h2>
        <p className="page-sub">Three approvals required to reconstruct.</p>
        <div className="enroll-progress u-mb-3">
          <div
            className="enroll-progress__fill"
            style={{ width: `${Math.min(100, (approvals / 3) * 100)}%` }}
          />
        </div>
        <p className="enroll-body-text text-center u-mb-4">{approvals} / 3 approvals</p>
        <div className="flex-col gap-2">
          {['Alice', 'Bob', 'Carol', 'David', 'Eve'].map((name, idx) => (
            <div key={name} className="guardian-pill">
              <span className="guardian-pill__email">{name}</span>
              {idx < approvals ? (
                <span className="badge-pill badge-pill--success">Verified</span>
              ) : (
                <span className="badge-pill badge-pill--warn">Pending</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="recovery-section-title">Bluetooth</h2>
        <p className="page-sub">Listening for guardian devices in range.</p>
        <div className="card recovery-bt">
          <Bluetooth size={22} strokeWidth={1.5} color="var(--accent)" aria-hidden />
          <div className="bluetooth-bar" aria-hidden />
          <p className="recovery-bt-label">Listening for approvals</p>
        </div>
      </section>

      <div className="btn-row">
        <button type="button" className="btn-secondary" onClick={() => navigate('/home')}>
          Home
        </button>
        <button type="button" className="btn-primary" onClick={() => setApprovals((a) => Math.min(3, a + 1))}>
          Simulate approval
        </button>
      </div>
    </div>
  );
}

export default RecoveryFlow;
