import { NavLink } from "react-router-dom";
import {
  Home,
  PlusCircle,
  Users,
  Package,
  KanbanSquare,
  HardHat,
  Route as RouteIcon,
  FileSpreadsheet,
  BookOpen,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const baseLinks = [
  { to: "/", label: "Jobs", icon: Home },
  { to: "/jobs/new", label: "Add Job", icon: PlusCircle },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/my-route", label: "My Route", icon: RouteIcon },
  { to: "/estimates", label: "Estimates", icon: FileSpreadsheet },
];

const adminLinks = [
  { to: "/dispatch", label: "Dispatch", icon: KanbanSquare },
  { to: "/technicians", label: "Techs", icon: HardHat },
  { to: "/price-book", label: "Price Book", icon: BookOpen },
  { to: "/store-orders", label: "Orders", icon: Package },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

export default function NavBar() {
  const { isAdmin } = useAuth();
  const links = isAdmin ? [...baseLinks, ...adminLinks] : baseLinks;

  return (
    <nav className="no-print fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background sm:static sm:border-t-0 sm:border-b">
      <div className="mx-auto flex max-w-3xl items-stretch justify-around overflow-x-auto sm:justify-start sm:gap-2 sm:px-4 sm:py-2">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium text-muted-foreground sm:flex-none sm:flex-row sm:rounded-md sm:px-3 sm:py-2 sm:text-sm",
                isActive && "text-primary sm:bg-secondary"
              )
            }
          >
            <Icon className="h-5 w-5 sm:h-4 sm:w-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
