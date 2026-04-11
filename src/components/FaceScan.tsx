import { useState, useCallback } from 'react';
import { CameraOff } from 'lucide-react';
import { requestCamera, stopCamera, isCameraSupported } from '../utils/camera';

async function computeMockBiometricHash(): Promise<string> {
  const mockEmbedding = 'face_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(mockEmbedding));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

type FaceScanProps = {
  onComplete: (biometricHash: string) => void;
};

function isPermissionError(message: string): boolean {
  return /permission denied|not allowed/i.test(message);
}

function isChromeDesktop(): boolean {
  return /Chrome/i.test(navigator.userAgent) && !/Mobile|Android|iPhone|iPad/i.test(navigator.userAgent);
}

const INSECURE_CAMERA_MSG =
  'Camera needs a secure context. Open this app via HTTPS (for example ngrok), use localhost, or continue with demo mode below.';

export function FaceScan({ onComplete }: FaceScanProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cameraUsable =
    typeof window !== 'undefined' && window.isSecureContext && isCameraSupported();

  const handleRequestCamera = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const stream = await requestCamera({ facingMode: 'user' });
      stopCamera(stream);
      const hash = await computeMockBiometricHash();
      console.log('[FaceScan] Face scan mock - biometric hash:', hash);
      onComplete(hash);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      console.error('[FaceScan] Camera failed:', err);
    } finally {
      setLoading(false);
    }
  }, [onComplete]);

  const handleSkipDemo = useCallback(() => {
    setError(null);
    const MOCK_FACE_HASH = 'sha256:demo_face_' + Date.now();
    console.log('[FaceScan] Demo skip - mock biometric:', MOCK_FACE_HASH);
    onComplete(MOCK_FACE_HASH);
  }, [onComplete]);

  if (!cameraUsable && !error) {
    return (
      <div className="card">
        <p className="camera-unavailable__warn mb-4">{INSECURE_CAMERA_MSG}</p>
        <p className="enroll-body-text text-center mb-4">Camera permission is required for face scan binding.</p>
        <p className="enroll-body-text text-center">
          Face embedding is hashed with SHA-256 only; no biometric imagery is stored.
        </p>
        <button type="button" className="btn-primary mt-4" onClick={handleSkipDemo} disabled={loading}>
          Skip for demo
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="camera-unavailable card">
        <div className="camera-unavailable__icon-wrap">
          <CameraOff size={40} strokeWidth={1.5} className="camera-unavailable__icon" aria-hidden />
        </div>
        <h3 className="camera-unavailable__title">Camera Unavailable</h3>
        <p className="camera-unavailable__body">{error}</p>
        {isPermissionError(error) && (
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
        <button type="button" className="btn-primary mt-3" onClick={handleSkipDemo}>
          Skip for demo
        </button>
        <button type="button" className="btn-ghost mt-3" onClick={() => setError(null)}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      {!isCameraSupported() && (
        <p className="camera-unavailable__warn mb-4">
          Camera API is not available in this context. Use HTTPS (e.g. ngrok) or localhost, or skip for demo.
        </p>
      )}
      <p className="enroll-body-text text-center mb-4">Camera permission is required for face scan binding.</p>
      <p className="enroll-body-text text-center">
        Face embedding is hashed with SHA-256 only; no biometric imagery is stored.
      </p>
      <button
        type="button"
        className="btn-primary mt-4"
        onClick={handleRequestCamera}
        disabled={loading}
      >
        {loading ? 'Requesting…' : 'Request camera'}
      </button>
      <button type="button" className="btn-ghost mt-3" onClick={handleSkipDemo} disabled={loading}>
        Skip for demo
      </button>
    </div>
  );
}
