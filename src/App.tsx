/**
 * SovereignID App Root
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import storage from './lib/storage';
import { initializeAppState } from './lib/config';
import queue from './lib/queue';
import { ToastProvider } from './context/ToastContext';
import { ShellLayout } from './ui/layout/ShellLayout';
import { OfflineBadge } from './components/OfflineBadge';
import { RoleSelectPage } from './ui/RoleSelectPage';
import { RootRedirect } from './ui/RootRedirect';
import { HomePage } from './ui/HomePage';
import { EnrollmentFlow } from './ui/enrollment/EnrollmentFlow';
import { WalletUI } from './ui/wallet/WalletUI';
import { CredentialsWallet } from './ui/credentials/CredentialsWallet';
import { RecoveryFlow } from './ui/recovery/RecoveryFlow';
import { VerifyPage } from './ui/VerifyPage';
import { SettingsPage } from './ui/SettingsPage';
import { ShareIdPage } from './ui/ShareIdPage';
import { SolanaStatusPage } from './ui/SolanaStatusPage';
import InstallBanner from './components/InstallBanner';

export function App() {
  const [appReady, setAppReady] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [swUpdateAvailable, setSwUpdateAvailable] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        const placeholderDeviceKey = crypto.getRandomValues(new Uint8Array(32));
        await storage.init(placeholderDeviceKey.buffer);
        await initializeAppState();
        // Initialize offline queue for pending operations (non-blocking)
        await queue.init().catch(err => console.warn('[App] Queue init failed:', err));
      } catch (error) {
        console.error('[App] Storage / app state init failed:', error);
        try {
          await storage.ensureInitialized();
          await initializeAppState();
        } catch (retryError) {
          console.error('[App] Storage retry failed:', retryError);
          setBootstrapError(
            'This app needs a secure context for encrypted storage (Web Crypto). Open it with HTTPS — for example https://192.168.x.x:5173 from `npm run dev` and accept the dev certificate — or use localhost. Plain http:// on a LAN address will not work.'
          );
          setAppReady(true);
          return;
        }
      }

      setAppReady(true);
    };

    initApp();

    window.addEventListener('sw-update-available', () => {
      setSwUpdateAvailable(true);
    });

    return () => {
      window.removeEventListener('sw-update-available', () => {});
    };
  }, []);

  if (!appReady) {
    return (
      <div className="splash-screen">
        <Shield className="splash-icon" size={48} strokeWidth={1.5} aria-hidden />
        <h1 className="splash-title">SovereignID</h1>
        <p className="splash-sub">Initializing offline-first identity vault</p>
        <div className="skeleton splash-skeleton" />
        <div className="skeleton splash-skeleton splash-skeleton--short" />
      </div>
    );
  }

  if (bootstrapError) {
    return (
      <div className="splash-screen">
        <Shield className="splash-icon" size={48} strokeWidth={1.5} aria-hidden />
        <h1 className="splash-title">SovereignID</h1>
        <p className="splash-sub" style={{ maxWidth: '28rem', textAlign: 'center' }}>
          {bootstrapError}
        </p>
      </div>
    );
  }

  return (
    <div className="app-mount">
      <InstallBanner />
      <OfflineBadge />

      {swUpdateAvailable && (
        <div className="sw-update-bar">
          <span className="sw-update-bar__text">Build update available</span>
          <button type="button" className="btn-primary btn-inline" onClick={() => window.location.reload()}>
            Refresh
          </button>
        </div>
      )}

      <Router>
        <ToastProvider>
          <Routes>
            <Route path="/welcome" element={<RoleSelectPage />} />
            <Route path="/enrollment" element={<EnrollmentFlow />} />

            <Route element={<ShellLayout />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/wallet" element={<WalletUI />} />
              <Route path="/verify" element={<VerifyPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/recovery" element={<RecoveryFlow />} />
              <Route path="/share" element={<ShareIdPage />} />
              <Route path="/solana" element={<SolanaStatusPage />} />
            </Route>

            <Route path="/credentials" element={<CredentialsWallet />} />
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </Router>
    </div>
  );
}
