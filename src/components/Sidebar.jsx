import { NavLink } from "react-router-dom";
import { Wrench } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { baseLinks, adminLinks } from "@/lib/navLinks";
import { cn } from "@/lib/utils";

// Desktop-only left sidebar. Hidden below the `sm` breakpoint, where
// Layout.jsx falls back to the bottom NavBar instead — a persistent
// sidebar on a phone-width screen trades away one-tap bottom nav access
// for no real benefit, so this only ever renders on wider screens.
export default function Sidebar() {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const links = isAdmin ? [...baseLinks, ...adminLinks] : baseLinks;

  return (
    <aside className="no-print sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-border bg-background sm:flex">
      <NavLink to="/" className="flex items-center gap-2 px-4 py-4">
        <Wrench className="h-5 w-5 text-primary" />
        <span className="font-semibold">Fieldsta</span>
      </NavLink>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        {links.map(({ to, labelKey, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent",
                isActive && "bg-secondary text-primary"
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{t(labelKey)}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
