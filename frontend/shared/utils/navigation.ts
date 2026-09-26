import {
  LayoutDashboard,
  Briefcase,
  Users,
  CalendarDays,
  Headset,
  Settings as SettingsIcon,
  Bot
} from "lucide-react";

export type View =
  | "dashboard"
  | "jobs"
  | "candidates"
  | "calendar"
  | "agent"
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
    id: "agent",
    label: "Агент",
    icon: Bot,
    href: "/dashboard/agent"
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
