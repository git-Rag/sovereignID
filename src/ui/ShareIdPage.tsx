import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { getDIDDocument } from '../lib/config';

export function ShareIdPage() {
  const navigate = useNavigate();
  const [identity, setIdentity] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const doc = await getDIDDocument();
        if (cancelled) return;
        const id = typeof doc?.id === 'string' ? doc.id : null;
        if (id) {
          setIdentity({ did: id, timestamp: new Date().toISOString() });
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page-pad page-enter">
      <h1 className="page-title">Share ID</h1>
      <p className="page-sub">Let someone verify you with a quick scan</p>

      {identity ? (
        <div className="share-qr-wrap">
          <p className="share-qr-label">Scan to verify your identity</p>
          <div className="share-qr-box">
            <QRCodeSVG value={JSON.stringify(identity)} size={160} level="M" bgColor="#ffffff" fgColor="#111118" />
          </div>
          <p className="share-did-text">{String(identity.did)}</p>
        </div>
      ) : (
        <div className="card mt-3">
          <p className="share-empty-copy">Complete enrollment to generate a shareable DID QR code.</p>
          <button type="button" className="btn-primary mt-3" onClick={() => navigate('/enrollment')}>
            Start enrollment
          </button>
        </div>
      )}
    </div>
  );
}
