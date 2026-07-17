import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { baseLinks, adminLinks } from "@/lib/navLinks";
import { cn } from "@/lib/utils";

// Mobile-only bottom tab bar. Desktop navigation lives in Sidebar.jsx —
// see Layout.jsx, which renders this only below the `sm` breakpoint.
export default function NavBar() {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const links = isAdmin ? [...baseLinks, ...adminLinks] : baseLinks;

  return (
    <nav className="no-print fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background">
      <div className="flex items-stretch justify-around overflow-x-auto">
        {links.map(({ to, labelKey, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium text-muted-foreground",
                isActive && "text-primary"
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span>{t(labelKey)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
