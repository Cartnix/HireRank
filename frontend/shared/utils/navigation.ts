import {
  LayoutDashboard,
  Briefcase,
  Users,
  CalendarDays,
  BarChart3,
  Headset,
  Settings as SettingsIcon,
} from "lucide-react";

export type View =
  | "dashboard"
  | "jobs"
  | "candidates"
  | "calendar"
  | "analytics"
  | "settings"
  | "support";

export const navItems: {
  id: View;
  label: string;
  icon: React.ElementType;
  href: string;
}[] = [
  {
    id: "dashboard",
    label: "Главная",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  { id: "jobs", label: "Вакансии", icon: Briefcase, href: "/dashboard/jobs" },
  {
    id: "candidates",
    label: "Кандидаты",
    icon: Users,
    href: "/dashboard/candidates",
  },
  {
    id: "calendar",
    label: "Календарь",
    icon: CalendarDays,
    href: "/dashboard/calendar",
  },
  {
    id: "analytics",
    label: "Аналитика",
    icon: BarChart3,
    href: "/dashboard/analytics",
  },
];

export const secondaryNavItems: {
  id: View;
  label: string;
  icon: React.ElementType;
  href: string;
}[] = [
  {
    id: "settings",
    label: "Настройки",
    icon: SettingsIcon,
    href: "/dashboard/settings",
  },
  {
    id: "support",
    label: "Поддержка",
    icon: Headset,
    href: "/dashboard/support",
  },
];
