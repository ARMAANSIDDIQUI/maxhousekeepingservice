import React, { createContext, useContext, useState, useEffect } from 'react';

const PWAContext = createContext(null);

export function PWAProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIOSDevice =
      typeof navigator !== 'undefined' &&
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !window.MSStream;
    setIsIOS(isIOSDevice);

    // Check if running in standalone mode (already installed app)
    const checkInstalled = () => {
      const isStandalone =
        (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ||
        (typeof window !== 'undefined' && window.navigator.standalone === true) ||
        (typeof document !== 'undefined' && document.referrer.includes('android-app://')) ||
        (typeof localStorage !== 'undefined' && localStorage.getItem('max_pwa_installed') === 'true');
      setIsInstalled(Boolean(isStandalone));
    };

    checkInstalled();

    const handleBeforeInstallPrompt = (e) => {
      // Prevent standard browser mini-infobar so custom footer button controls it
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstalled(false);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsInstallModalOpen(false);
      try {
        localStorage.setItem('max_pwa_installed', 'true');
      } catch {}
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setIsInstalled(true);
          try {
            localStorage.setItem('max_pwa_installed', 'true');
          } catch {}
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('[PWA Install Prompt Notice]:', err);
        setIsInstallModalOpen(true);
      }
    } else {
      // Show instructional modal (iOS Safari or unsupported browsers)
      setIsInstallModalOpen(true);
    }
  };

  return (
    <PWAContext.Provider
      value={{
        isInstalled,
        deferredPrompt,
        isIOS,
        promptInstall,
        isInstallModalOpen,
        setIsInstallModalOpen
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}

export default PWAContext;
