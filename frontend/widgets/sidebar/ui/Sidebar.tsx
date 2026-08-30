"use client";

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

export function Sidebar() {
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
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-border bg-background-elevated py-5">
      <nav className="flex flex-1 flex-col gap-2">
        <div className="flex h-14 items-center gap-2.5 rounded-lg px-5 text-[14px]">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-cyan-300 text-[15px] font-bold text-background">
            H
          </div>
          <div className="text-[16px] font-bold tracking-tight">
            Hire<span className="text-[16px] font-bold text-cyan-300">AI</span>
          </div>
        </div>

        <div className="my-3 h-px bg-border" />

        <div className="px-5 pb-1 text-[14px] font-semibold uppercase tracking-wide text-muted-foreground/">
          Основное
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
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

        <div className="my-3 h-px bg-border" />

        <div className="px-5 pb-1 text-[14px] font-semibold uppercase tracking-wide text-muted-foreground/70">
          Прочее
        </div>

        {secondaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
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
            onClick={handleSignOut}
            className="text-red-600 focus:text-red-600 cursor-pointer"
          >
            <LogOut size={16} className="mr-2" />
            Выйти
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </aside>
  );
}
