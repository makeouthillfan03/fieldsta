import { Outlet, Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import NavBar from "@/components/NavBar";
import Sidebar from "@/components/Sidebar";
import AppStatusBanner from "@/components/AppStatusBanner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { logout } from "@/lib/firebase";

export default function Layout() {
  const { user } = useAuth();
  const { lang, setLang, t } = useLanguage();

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <header className="no-print sticky top-0 z-30 border-b border-border bg-background">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <Link to="/" className="flex items-center gap-2 sm:hidden">
              <img src="/mascot.png" alt="" className="h-6 w-6" />
              <span className="font-semibold">Fieldsta</span>
            </Link>
            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLang(lang === "en" ? "es" : "en")}
                className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-accent"
                aria-label="Switch language"
                title={lang === "en" ? "Cambiar a Español" : "Switch to English"}
              >
                {t("lang.toggle")}
              </button>
              {user?.photoURL && (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "avatar"}
                  className="h-7 w-7 rounded-full"
                />
              )}
              <Button variant="ghost" size="icon" onClick={logout} aria-label={t("common.signOut")}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <AppStatusBanner />

        <main className="mx-auto max-w-3xl px-4 py-4 pb-20 sm:pb-6">
          <Outlet />
        </main>

        <div className="sm:hidden">
          <NavBar />
        </div>
      </div>
    </div>
  );
}
