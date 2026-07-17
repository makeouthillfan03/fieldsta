import { useEffect, useState } from "react";
import { Download, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Two small, dismissible banners:
// 1. Offline indicator - Firestore's own local cache keeps the app usable,
//    this just tells the technician why data might be stale.
// 2. "Install app" prompt - surfaces the browser's native PWA install flow
//    (Android/desktop Chrome/Edge fire `beforeinstallprompt`; iOS Safari
//    doesn't support this event, so iOS users add via Share > Add to Home
//    Screen instead - mentioned in the README).
export default function AppStatusBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installDismissed, setInstallDismissed] = useState(false);

  useEffect(() => {
    function goOffline() {
      setIsOffline(true);
    }
    function goOnline() {
      setIsOffline(false);
    }
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  useEffect(() => {
    function handleBeforeInstall(e) {
      e.preventDefault();
      setInstallPrompt(e);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  return (
    <div className="no-print">
      {isOffline && (
        <div className="flex items-center gap-2 bg-amber-100 px-4 py-2 text-xs font-medium text-amber-800">
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          You're offline — showing saved data. Changes will sync once you're back online.
        </div>
      )}
      {installPrompt && !installDismissed && (
        <div className="flex items-center justify-between gap-2 bg-primary/10 px-4 py-2 text-xs">
          <span className="flex items-center gap-2 font-medium text-primary">
            <Download className="h-3.5 w-3.5 shrink-0" /> Install FieldSta for one-tap access
          </span>
          <div className="flex items-center gap-1">
            <Button size="sm" className="h-7 px-2 text-xs" onClick={handleInstall}>
              Install
            </Button>
            <button
              onClick={() => setInstallDismissed(true)}
              aria-label="Dismiss"
              className="p-1 text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
