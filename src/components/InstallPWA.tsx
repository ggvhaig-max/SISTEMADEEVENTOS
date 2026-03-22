import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-900 rounded-lg shadow-2xl p-4 z-50 animate-slide-up">
      <button
        onClick={() => setShowInstallBanner(false)}
        className="absolute top-2 right-2 text-slate-900/80 hover:text-slate-900"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 bg-white/20 rounded-lg p-2">
          <Download className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">Instalar App</h3>
          <p className="text-sm text-blue-100 mb-3">
            Instala la app en tu dispositivo para acceder más rápido y recibir notificaciones
          </p>
          <button
            onClick={handleInstall}
            className="w-full bg-white text-blue-600 font-bold py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Instalar Ahora
          </button>
        </div>
      </div>
    </div>
  );
}
