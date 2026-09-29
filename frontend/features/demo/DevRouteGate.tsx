"use client";
import { usePathname } from "next/navigation";
import { useDemo } from "./DemoProvider";
const developmentRoutes = ["/dashboard/calendar", "/dashboard/agent", "/dashboard/copilot", "/dashboard/audit", "/dashboard/settings", "/dashboard/support"];
export function DevRouteGate({ children }: { children: React.ReactNode }) {
  const { enabled } = useDemo();
  const pathname = usePathname();
  if (!enabled && developmentRoutes.some(route => pathname === route || pathname.startsWith(route + "/"))) {
    return <p className="text-sm text-muted-foreground">Этот раздел доступен в Dev mode. Включите песочницу в меню.</p>;
  }
  return children;
}
