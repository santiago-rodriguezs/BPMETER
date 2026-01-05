/**
 * Service Worker Registration
 * 
 * Registers the service worker for PWA functionality.
 * Call this from a client component after mount.
 */

export function registerServiceWorker() {
  if (typeof window === 'undefined') return;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute
        })
        .catch((error) => {
          console.error('SW registration failed:', error);
        });
    });
  }
}

/**
 * Check if app can be installed
 */
export function setupInstallPrompt(
  onInstallable: (prompt: any) => void
) {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    onInstallable(e);
  });
}

/**
 * Trigger install prompt
 */
export async function triggerInstall(deferredPrompt: any): Promise<boolean> {
  if (!deferredPrompt) return false;

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  
  return outcome === 'accepted';
}

