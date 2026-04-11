/**
 * Service Worker Registration
 * 
 * Registers the service worker for offline PWA support.
 * The service worker is configured by vite-plugin-pwa in vite.config.ts.
 */

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Service Worker API not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      '/sw.js?v=' + new Date().getTime(),
      { scope: '/' }
    );

    console.log('[SW] Service Worker registered successfully', registration);

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New SW available; notify user to refresh
          window.dispatchEvent(
            new CustomEvent('sw-update-available', {
              detail: { registration }
            })
          );
          console.log('[SW] Update available — user should refresh');
        }
      });
    });

    return registration;
  } catch (error) {
    console.error('[SW] Registration failed:', error);
    return null;
  }
}

/**
 * Unregister service worker (for testing/debugging).
 */
export async function unregisterServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const registration of registrations) {
    await registration.unregister();
    console.log('[SW] Unregistered');
  }
}
