/**
 * CAMERA SETUP NOTES:
 *
 * Camera (getUserMedia) requires a secure context:
 * ✓ https://localhost:5173 / https://192.168.x.x:5173 — works (Vite dev uses @vitejs/plugin-basic-ssl)
 * ✓ ngrok HTTPS URL — works
 * ✗ http://192.168.x.x:5173 — BLOCKED (not secure context; Web Crypto storage fails too)
 */

export type CameraFacingMode = 'user' | 'environment';

export type RequestCameraOptions = {
  /** `user` = selfie / face scan; `environment` = rear camera for QR */
  facingMode?: CameraFacingMode;
};

export async function requestCamera(options?: RequestCameraOptions): Promise<MediaStream> {
  const facingMode = options?.facingMode ?? 'environment';

  if (!navigator?.mediaDevices?.getUserMedia) {
    throw new Error(
      'Camera not available. Please use HTTPS or allow camera access in browser settings.',
    );
  }

  if (!window.isSecureContext) {
    throw new Error(
      'Camera requires a secure connection (HTTPS). ' +
        'If testing locally, use localhost (not an IP address).',
    );
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
    return stream;
  } catch (err: unknown) {
    const e = err as { name?: string; message?: string };
    if (e.name === 'NotAllowedError') {
      throw new Error('Camera permission denied. Please allow camera access and try again.');
    }
    if (e.name === 'NotFoundError') {
      throw new Error('No camera found on this device.');
    }
    if (e.name === 'NotReadableError') {
      throw new Error('Camera is already in use by another app.');
    }
    throw new Error('Could not access camera: ' + (e.message ?? String(err)));
  }
}

export function stopCamera(stream: MediaStream | null) {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
}

export function isCameraSupported(): boolean {
  // Typed DOM may always include getUserMedia; runtime still lacks it on insecure HTTP / old browsers.
  if (typeof navigator === 'undefined' || !window.isSecureContext) return false;
  const md = navigator.mediaDevices;
  return !!md && typeof md.getUserMedia === 'function';
}
