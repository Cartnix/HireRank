"use client";
import { useState } from "react";

import { useDemo, demoCan } from "@/features/demo/DemoProvider";
import { label } from "@/features/hr-copilot/ui/constants";
import type { Role } from "@/features/hr-copilot/model/types";
import { Avatar } from "@/shared/ui/Avatar";
import { navItems, secondaryNavItems } from "@/shared/utils/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/shared/api/auth-store";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "@/shared/ui/components/ThemeToogle";

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const demo = useDemo();
  const pathname = usePathname();
  const { signOut } = useAuth();
  const router = useRouter();
  const user = useCurrentUser();

  const handleSignOut = async () => {
    const error = await signOut();
    if (!error) {
      router.push("/auth");
    }
  };

  return (
    <aside className="relative flex h-auto w-full md:sticky md:top-0 md:h-screen md:w-60 shrink-0 flex-col border-r bg-sidebar border-sidebar-border py-5 text-sidebar-foreground">
      <button type="button" aria-expanded={mobileOpen} aria-controls="dashboard-sidebar-navigation" className="mx-4 flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>HireAI · Меню <span>{mobileOpen ? "Закрыть" : "Открыть"}</span></button>
      <nav id="dashboard-sidebar-navigation" className={`${mobileOpen ? "flex" : "hidden"} md:flex flex-1 flex-col gap-2 md:min-h-0 md:overflow-y-auto`}>
        <div className="flex h-14 items-center gap-2.5 rounded-lg px-5 text-[14px]">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-cyan-300 text-[15px] font-bold text-background">
            H
          </div>
          <div className="text-[16px] font-bold tracking-tight">
            Hire<span className="text-[16px] font-bold text-cyan-300">AI</span>
          </div>
        </div>

        <div className="mx-3 my-3 space-y-2 rounded-lg border border-border p-3">
          <label className="flex gap-2 text-xs"><input type="checkbox" checked={demo.enabled} onChange={e => { demo.setEnabled(e.target.checked); router.push("/dashboard"); }} /> Dev mode</label>
          <p className="text-xs text-muted-foreground">{demo.enabled ? "Песочница: тестовые данные и функции в разработке" : "Данные из API"}</p>
          {demo.enabled && <label className="block text-xs">Роль в песочнице<select aria-label="Роль в песочнице" className="mt-2 w-full rounded border border-input bg-background p-2" value={demo.role} onChange={e => { demo.setRole(e.target.value as Role); router.push("/dashboard"); }}>{Object.entries(label).map(([role, name]) => <option key={role} value={role}>{name}</option>)}</select></label>}
        </div>
        {(demo.enabled && demo.role === "administrator") && <Link className="mx-3 rounded-lg px-3 py-2 text-sm" href="/dashboard/audit">Журнал действий</Link>}
        <div className="my-3 h-px bg-sidebar-border" />

        <div className="px-5 pb-1 text-[14px] font-semibold uppercase tracking-wide/ text-muted-foreground/70">
          Основное
        </div>

        {navItems.filter(item => demo.enabled ? (demoCan(demo.role, item.id) || (["calendar", "agent"].includes(item.id) && ["hr", "administrator"].includes(demo.role))) : ["dashboard", "jobs", "candidates"].includes(item.id)).map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center gap-2.5 rounded-lg px-3 py-2.5 mx-3 text-[14px] transition-all duration-200 ${
                isActive
                  ? "active-glow-item font-semibold text-cyan-300"
                  : "text-muted-foreground hover:translate-x-0.5 hover:bg-background-hover hover:text-foreground"
              }`}
            >
              <Icon
                size={18}
                className={`transition-colors duration-200 ${
                  isActive ? "text-active-item" : "group-hover:text-foreground"
                }`}
              />
              {demo.enabled && ["dashboard", "jobs", "candidates", "copilot"].includes(item.id) ? `${item.id === "candidates" && demo.role === "recruiter" ? "Приём резюме" : item.id === "candidates" && demo.role === "candidate" ? "Моя анкета" : item.label}` : item.label}
            </Link>
          );
        })}

        <div className="my-3 h-px bg-sidebar-border" />

        <div className="px-5 pb-1 text-[14px] font-semibold uppercase tracking-wide text-muted-foreground/70">
          Прочее
        </div>

        {secondaryNavItems.filter(item => demo.enabled || !item.inDevelopment).map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          if (item.inDevelopment) {
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <div className="group relative flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2.5 mx-3 text-[14px] text-muted-foreground/40 bg-secondary/20 border border-border/20">
                    <Icon size={18} className="text-muted-foreground/30" />
                    <span>{item.label}</span>
                    <span className="ml-auto rounded-md bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning border border-warning/20">
                      Скоро
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Раздел в разработке — скоро будет доступен
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center gap-2.5 rounded-lg px-3 py-2.5 mx-3 text-[14px] transition-all duration-200 ${
                isActive
                  ? "active-glow-item font-semibold text-cyan-300"
                  : "text-muted-foreground hover:translate-x-0.5 hover:bg-background-hover hover:text-foreground"
              }`}
            >
              <Icon
                size={18}
                className={`transition-colors duration-200 ${
                  isActive ? "text-active-item" : "group-hover:text-foreground"
                }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className={`${mobileOpen ? "block" : "hidden"} md:block shrink-0`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center justify-between rounded-[10px] border border-border px-3 py-2.5 transition-colors hover:bg-background-hover cursor-pointer outline-none">
            <div className="flex items-center gap-2">
              <Avatar
                name={[user?.first_name, user?.last_name]
                  .filter(Boolean)
                  .join(" ")}
                size={36}
              />
              <div className="text-[1.1em] font-bold leading-tight">
                {[user?.first_name, user?.last_name].filter(Boolean).join(" ")}
              </div>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className="p-0 focus:bg-transparent"
          >
            <ThemeToggle />
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleSignOut}
            className="text-red-600 focus:text-red-600 cursor-pointer"
          >
            <LogOut size={16} className="mr-2" />
            Выйти
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </aside>
  );
}
