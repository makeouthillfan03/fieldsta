import { Outlet } from "react-router-dom";
import { LogOut, Wrench } from "lucide-react";
import NavBar from "@/components/NavBar";
import AppStatusBanner from "@/components/AppStatusBanner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/lib/firebase";

export default function Layout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="no-print sticky top-0 z-30 border-b border-border bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            <span className="font-semibold">FieldSta</span>
          </div>
          <div className="flex items-center gap-3">
            {user?.photoURL && (
              <img
                src={user.photoURL}
                alt={user.displayName || "avatar"}
                className="h-7 w-7 rounded-full"
              />
            )}
            <Button variant="ghost" size="icon" onClick={logout} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="hidden sm:block">
          <NavBar />
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
  );
}
