"use client";
import { useState } from "react";

import { useDemo } from "@/features/demo/DemoProvider";
import { demoCan } from "@/features/demo/access";
import { label } from "@/features/hr-copilot/ui/constants";
import type { Role } from "@/features/hr-copilot/model/types";
import { Avatar } from "@/shared/ui/Avatar";
import { navItems, secondaryNavItems } from "@/shared/utils/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, FlaskConical, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/shared/api/auth-store";
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
    <aside className="relative flex h-auto w-full shrink-0 flex-col border-b border-sidebar-border bg-sidebar py-3 text-sidebar-foreground lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:border-b-0 lg:border-r lg:py-5">
      <button type="button" aria-expanded={mobileOpen} aria-controls="dashboard-sidebar-navigation" className="mx-3 flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}>HireAI · Меню <span>{mobileOpen ? "Закрыть" : "Открыть"}</span></button>
      <nav id="dashboard-sidebar-navigation" className={`${mobileOpen ? "flex" : "hidden"} flex-1 flex-col gap-2 lg:flex lg:min-h-0 lg:overflow-y-auto`}>
        <div className="flex h-14 items-center gap-2.5 rounded-lg px-5 text-[14px]">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand-primary text-[15px] font-bold text-brand-primary-foreground">
            H
          </div>
          <div className="text-[16px] font-bold tracking-tight">
            Hire<span className="text-[16px] font-bold text-brand-primary">AI</span>
          </div>
        </div>

        {(demo.canDevelop || demo.canAdminister) && (
          <details className="group mx-3 my-2 overflow-hidden rounded-xl border border-blue-400/15 bg-blue-500/[0.04]">
            <summary className="flex cursor-pointer list-none items-center gap-2.5 px-3 py-3 outline-none transition-colors hover:bg-blue-500/[0.06] [&::-webkit-details-marker]:hidden">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-400/15 bg-blue-500/10 text-blue-300">
                {demo.canDevelop ? <FlaskConical size={16} /> : <ShieldCheck size={16} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-slate-200">
                  {demo.canDevelop ? "Панель разработчика" : "Администрирование"}
                </span>
                <span className="mt-0.5 block truncate text-[10px] text-slate-500">
                  {demo.canDevelop ? "Тестовые данные и роли" : "Управление доступом"}
                </span>
              </span>
              {demo.enabled && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-400">Dev</span>}
              <ChevronDown size={14} className="shrink-0 text-slate-500 transition-transform group-open:rotate-180" />
            </summary>

            <div className="space-y-3 border-t border-white/[0.06] px-3 py-3">
              {demo.canDevelop && (
                <>
                  <label className="flex cursor-pointer items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block text-xs font-medium text-slate-200">Тестовый режим</span>
                      <span className="mt-0.5 block text-[10px] text-slate-500">
                        {demo.enabled ? "Источник: dev база данных" : "Источник: рабочая база данных"}
                      </span>
                    </span>
                    <span className="relative inline-flex shrink-0">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        aria-label="Тестовый режим"
                        checked={demo.enabled}
                        disabled={!demo.devAvailable}
                        onChange={(event) => {
                          demo.setEnabled(event.target.checked);
                          router.push("/dashboard");
                        }}
                      />
                      <span className="h-5 w-9 rounded-full bg-slate-700 transition-colors peer-checked:bg-blue-500 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-400 peer-disabled:cursor-not-allowed peer-disabled:opacity-40 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
                    </span>
                  </label>

                  <label className="block text-xs font-medium text-slate-300">
                    Просмотр от роли
                    <select
                      aria-label="Просмотр от роли"
                      className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-[#0b121e] px-2.5 py-2 text-xs text-slate-200 outline-none transition-colors focus:border-blue-400/40"
                      value={demo.role}
                      onChange={(event) => {
                        demo.setRole(event.target.value as Role);
                        router.push("/dashboard");
                      }}
                    >
                      {Object.entries(label).map(([role, name]) => (
                        <option key={role} value={role}>{name}</option>
                      ))}
                    </select>
                  </label>
                </>
              )}

              {demo.canAdminister && (
                <label className="flex cursor-pointer items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
                  <span>
                    <span className="block text-xs font-medium text-slate-200">Режим администрирования</span>
                    <span className="mt-0.5 block text-[10px] text-slate-500">Разрешить действия с данными</span>
                  </span>
                  <span className="relative inline-flex shrink-0">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      aria-label="Режим администрирования"
                      checked={demo.administration}
                      onChange={(event) => demo.setAdministration(event.target.checked)}
                    />
                    <span className="h-5 w-9 rounded-full bg-slate-700 transition-colors peer-checked:bg-blue-500 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-400 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
                  </span>
                </label>
              )}

              {demo.message && <p role="alert" className="m-0 rounded-lg border border-rose-400/15 bg-rose-500/[0.06] px-2.5 py-2 text-[11px] text-rose-300">{demo.message}</p>}

              {(demo.canDevelop || demo.canAdminister || (demo.enabled && ["administrator", "superuser"].includes(demo.role))) && (
                <div className="space-y-1 border-t border-white/[0.06] pt-2">
                  {demo.canDevelop && <Link className={`block rounded-lg px-2.5 py-2 text-xs transition-colors hover:bg-white/[0.05] ${pathname === "/dashboard/developer" ? "text-blue-300" : "text-slate-400 hover:text-slate-200"}`} href="/dashboard/developer">Настройки DEV</Link>}
                  {demo.canAdminister && <Link className={`block rounded-lg px-2.5 py-2 text-xs transition-colors hover:bg-white/[0.05] ${pathname === "/dashboard/users" ? "text-blue-300" : "text-slate-400 hover:text-slate-200"}`} href="/dashboard/users">Пользователи</Link>}
                  {demo.enabled && ["administrator", "superuser"].includes(demo.role) && <Link className={`block rounded-lg px-2.5 py-2 text-xs transition-colors hover:bg-white/[0.05] ${pathname === "/dashboard/audit" ? "text-blue-300" : "text-slate-400 hover:text-slate-200"}`} href="/dashboard/audit">Журнал действий</Link>}
                </div>
              )}
            </div>
          </details>
        )}
        <div className="my-3 h-px bg-sidebar-border" />

        <div className="px-5 pb-1 text-[14px] font-semibold uppercase tracking-wide text-muted-foreground">
          Основное
        </div>

        {navItems.filter(item => demoCan(demo.role, item.id) && (demo.enabled || !["agent"].includes(item.id))).map((item) => {
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
                  ? "active-glow-item font-semibold text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:translate-x-0.5 hover:bg-accent hover:text-foreground"
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

        {secondaryNavItems.filter(item => demo.enabled && demoCan(demo.role, item.id)).map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center gap-2.5 rounded-lg px-3 py-2.5 mx-3 text-[14px] transition-all duration-200 ${
                isActive
                  ? "active-glow-item font-semibold text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:translate-x-0.5 hover:bg-accent hover:text-foreground"
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

      <div className={`${mobileOpen ? "block" : "hidden"} shrink-0 px-3 pt-4 lg:block`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center justify-between rounded-[10px] border border-border px-3 py-2.5 transition-colors hover:bg-accent cursor-pointer outline-none">
            <div className="flex min-w-0 items-center gap-3 text-left">
              <Avatar
                name={[user?.first_name, user?.last_name]
                  .filter(Boolean)
                  .join(" ") || "HR"}
                size={36}
              />
              <div className="min-w-0"><div className="truncate text-sm font-semibold">{[user?.first_name, user?.last_name].filter(Boolean).join(" ") || "HR профиль"}</div><div className="mt-1 text-xs text-muted-foreground">{label[demo.role] ?? "Пользователь"}{demo.enabled ? " · Dev mode" : ""}</div></div>
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
