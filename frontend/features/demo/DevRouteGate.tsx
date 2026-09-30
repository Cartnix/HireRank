"use client";
import { usePathname } from "next/navigation";
import { demoCan } from "./access";
import { useDemo } from "./DemoProvider";
const developmentRoutes = ["/dashboard/calendar", "/dashboard/agent", "/dashboard/copilot", "/dashboard/audit", "/dashboard/settings", "/dashboard/support"];
export function DevRouteGate({ children }: { children: React.ReactNode }) {
  const { ready, enabled, canDevelop, role } = useDemo();
  const pathname = usePathname();
  if (!ready) return <p className="text-sm text-muted-foreground">Проверяем доступ...</p>;
  if (!enabled && developmentRoutes.some(route => pathname === route || pathname.startsWith(route + "/"))) {
    return <p className="text-sm text-muted-foreground">{canDevelop ? "Этот раздел доступен в Dev mode. Включите тестовые данные в меню." : "Раздел недоступен."}</p>;
  }
  if (enabled && developmentRoutes.some(route => pathname === route || pathname.startsWith(route + "/")) && !demoCan(role, pathname.split("/")[2])) return <p role="alert">Для выбранной роли здесь пока нет доступных данных и действий.</p>;
  return children;
}
