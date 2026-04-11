import { useEffect, useRef, useState } from 'react';
import type { TouchEvent } from 'react';
import { Download, MoreVertical, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const SESSION_KEY = 'installBannerDismissed';

/** Inline mark — no raster; avoids manifest placeholder tint issues */
function InstallMark() {
  return (
    <svg className="install-mark" viewBox="0 0 48 48" aria-hidden>
      <defs>
        <linearGradient id="installG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2a2a42" />
          <stop offset="100%" stopColor="#141422" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="11" fill="url(#installG)" />
      <circle cx="24" cy="22" r="9" fill="none" stroke="rgba(250,250,250,0.35)" strokeWidth="1.25" />
      <circle cx="24" cy="22" r="4" fill="rgba(250,250,250,0.9)" />
      <path
        d="M14 34c3-4 7-6 10-6s7 2 10 6"
        fill="none"
        stroke="rgba(250,250,250,0.45)"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragCurrentX = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }
    if (sessionStorage.getItem(SESSION_KEY) === 'true') return;

    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase()));

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setVisible(false);
    };

    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);
    const t = window.setTimeout(() => setVisible(true), 1500);
    return () => {
      clearTimeout(t);
      window.removeEventListener('beforeinstallprompt', onBip);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    const el = sheetRef.current;
    if (el) {
      el.style.transition = 'transform 250ms ease-out, opacity 250ms ease-out';
      el.style.transform = 'translateX(110%)';
      el.style.opacity = '0';
    }
    window.setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem(SESSION_KEY, 'true');
    }, 260);
  };

  const handleTouchStart = (e: TouchEvent) => {
    dragStartX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.current || !sheetRef.current) return;
    const delta = e.touches[0].clientX - dragStartX.current;
    dragCurrentX.current = delta;
    if (delta > 0) {
      sheetRef.current.style.transform = `translateX(${delta}px)`;
      sheetRef.current.style.opacity = `${Math.max(0, 1 - delta / 200)}`;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current || !sheetRef.current) return;
    isDragging.current = false;
    if (dragCurrentX.current > 100) dismiss();
    else {
      sheetRef.current.style.transition = 'transform 200ms ease-out, opacity 200ms ease-out';
      sheetRef.current.style.transform = 'translateX(0)';
      sheetRef.current.style.opacity = '1';
      window.setTimeout(() => {
        if (sheetRef.current) sheetRef.current.style.transition = '';
      }, 200);
    }
    dragCurrentX.current = 0;
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setVisible(false);
    } else {
      setShowHelp(true);
    }
  };

  if (!visible || installed) return null;

  return (
    <>
      <div className="install-bd" aria-hidden />
      <div className="install-wrap">
        <div
          ref={sheetRef}
          className="install"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="install-h" />
          <p className="install-hint">Swipe right to dismiss</p>

          <div className="install-row">
            <div className="install-ico">
              <InstallMark />
            </div>
            <div className="install-meta">
              <span className="install-title">SovereignID</span>
              <span className="install-sub">Install for offline use</span>
            </div>
            <button type="button" className="install-x" onClick={dismiss} aria-label="Close">
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>

          <div className="install-pills">
            {['Offline', 'No sign-in', 'Private'].map((f) => (
              <span key={f} className="install-pill">
                {f}
              </span>
            ))}
          </div>

          {showHelp && (
            <div className="install-help">
              {!isIOS ? (
                <>
                  <p className="install-help-line">
                    <MoreVertical size={14} strokeWidth={2} className="install-help-ic" />
                    <span>
                      <strong>Chrome / Edge:</strong> tap <strong>⋮</strong> → <strong>Install app</strong> or check
                      the install icon in the address bar.
                    </span>
                  </p>
                  <p className="install-help-note">Other browsers: use the menu and look for “Install” or “Add to Home screen”.</p>
                </>
              ) : (
                <>
                  <p className="install-help-line">
                    <span className="install-help-n">1</span>
                    <span>
                      Tap <strong>Share</strong> → <strong>Add to Home Screen</strong> → <strong>Add</strong>.
                    </span>
                  </p>
                  <p className="install-help-note">Works from Safari or Chrome on iPhone.</p>
                </>
              )}
            </div>
          )}

          {!showHelp && (
            <button type="button" className="install-btn" onClick={handleInstall}>
              <Download size={16} strokeWidth={1.5} />
              Install
            </button>
          )}

          <button type="button" className="install-skip" onClick={dismiss}>
            Not now
          </button>
        </div>
      </div>
    </>
  );
}
