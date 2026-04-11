import { useEffect, useRef, useState, useCallback } from 'react';
import { CameraOff } from 'lucide-react';
import { requestCamera, stopCamera } from '../utils/camera';

type QRScannerProps = {
  onDidResolved: (did: string) => void;
};

function isPermissionError(message: string): boolean {
  return /permission denied|not allowed/i.test(message);
}

function isChromeDesktop(): boolean {
  return /Chrome/i.test(navigator.userAgent) && !/Mobile|Android|iPhone|iPad/i.test(navigator.userAgent);
}

export function QRScanner({ onDidResolved }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<'loading' | 'live' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [manualDid, setManualDid] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stream = await requestCamera({ facingMode: 'environment' });
        if (cancelled) {
          stopCamera(stream);
          return;
        }
        streamRef.current = stream;
        const el = videoRef.current;
        if (el) {
          el.srcObject = stream;
          await el.play().catch(() => {});
        }
        setStatus('live');
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMessage(msg);
        setStatus('error');
        console.error('[QRScanner] Camera failed:', err);
      }
    })();

    return () => {
      cancelled = true;
      stopCamera(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  const submitManual = useCallback(() => {
    const t = manualDid.trim();
    if (t) onDidResolved(t);
  }, [manualDid, onDidResolved]);

  if (status === 'error') {
    return (
      <div className="camera-unavailable">
        <div className="verify-frame verify-frame--qr-error">
          <div className="camera-unavailable__icon-wrap camera-unavailable__icon-wrap--inline">
            <CameraOff size={40} strokeWidth={1.5} className="camera-unavailable__icon" aria-hidden />
          </div>
        </div>
        <h3 className="camera-unavailable__title">Camera Unavailable</h3>
        <p className="camera-unavailable__body">{errorMessage}</p>
        {isPermissionError(errorMessage) && (
          <>
            {isChromeDesktop() ? (
              <a className="btn-secondary camera-unavailable__btn" href="chrome://settings/content/camera">
                Open browser settings
              </a>
            ) : (
              <p className="camera-unavailable__hint">
                Go to Settings → Safari/Chrome → Camera → Allow for this site.
              </p>
            )}
          </>
        )}
        <label className="qr-manual-label font-body" htmlFor="manual-did">
          Enter DID manually
        </label>
        <input
          id="manual-did"
          className="input-field qr-manual-input"
          placeholder="did:key:…"
          value={manualDid}
          onChange={(e) => setManualDid(e.target.value)}
        />
        <button type="button" className="btn-primary mt-3" onClick={submitManual} disabled={!manualDid.trim()}>
          Verify DID
        </button>
      </div>
    );
  }

  return (
    <div className="verify-frame verify-frame--qr">
      <video ref={videoRef} className="qr-scanner-video" playsInline muted autoPlay />
      <div className="verify-corner verify-corner--tl" />
      <div className="verify-corner verify-corner--tr" />
      <div className="verify-corner verify-corner--bl" />
      <div className="verify-corner verify-corner--br" />
      <div className="verify-frame__line" aria-hidden />
      {status === 'loading' && <div className="qr-scanner-loading font-body">Starting camera…</div>}
    </div>
  );
}
