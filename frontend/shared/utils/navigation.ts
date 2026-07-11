import {
  LayoutDashboard,
  Briefcase,
  Users,
  CalendarDays,
  BarChart3,
  Settings as SettingsIcon,
} from "lucide-react";

export type View =
  | "dashboard"
  | "jobs"
  | "candidates"
  | "calendar"
  | "analytics"
  | "settings";

export const navItems: { id: View; label: string; icon: React.ElementType }[] =
  [
    { id: "dashboard", label: "Главная", icon: LayoutDashboard },
    { id: "jobs", label: "Вакансии", icon: Briefcase },
    { id: "candidates", label: "Кандидаты", icon: Users },
    { id: "calendar", label: "Календарь", icon: CalendarDays },
    { id: "analytics", label: "Аналитика", icon: BarChart3 },
    { id: "settings", label: "Настройки", icon: SettingsIcon },
  ];
