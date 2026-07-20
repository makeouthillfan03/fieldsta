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
  UsersRound,
  CalendarCheck,
  Sparkles,
  CreditCard,
  CalendarPlus,
} from "lucide-react";

// Shared between the mobile bottom NavBar and the desktop Sidebar so both
// stay in sync automatically.
export const baseLinks = [
  { to: "/", labelKey: "nav.jobs", icon: Home },
  { to: "/jobs/new", labelKey: "nav.addJob", icon: PlusCircle },
  { to: "/customers", labelKey: "nav.customers", icon: Users },
  { to: "/my-route", labelKey: "nav.myRoute", icon: RouteIcon },
  { to: "/estimates", labelKey: "nav.estimates", icon: FileSpreadsheet },
  { to: "/agreements", labelKey: "nav.agreements", icon: CalendarCheck },
  { to: "/assistant", labelKey: "nav.assistant", icon: Sparkles },
  { to: "/billing", labelKey: "nav.billing", icon: CreditCard },
];

export const adminLinks = [
  { to: "/dispatch", labelKey: "nav.dispatch", icon: KanbanSquare },
  { to: "/technicians", labelKey: "nav.techs", icon: HardHat },
  { to: "/price-book", labelKey: "nav.priceBook", icon: BookOpen },
  { to: "/store-orders", labelKey: "nav.orders", icon: Package },
  { to: "/booking-requests", labelKey: "nav.bookingRequests", icon: CalendarPlus },
  { to: "/reports", labelKey: "nav.reports", icon: BarChart3 },
  { to: "/team", labelKey: "nav.team", icon: UsersRound },
];
