'use client';

import { Avatar } from "@/shared/ui/Avatar";
import { navItems } from "@/shared/utils/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-border bg-background-elevated px-3 py-5">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-brand-primary text-[14px] font-bold text-brand-primary-foreground">
          H
        </div>
        <div className="text-[15px] font-semibold">HireAI</div>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5">
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
              className={`flex items-center gap-2 rounded-lg px-2 py-2 text-[13.5px] transition-colors ${
                isActive
                  ? "bg-brand-primary/10 font-semibold text-brand-primary"
                  : "text-muted-foreground hover:bg-background-hover"
              }`}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center justify-between rounded-[10px] border border-border px-3 py-2.5 transition-colors hover:bg-background-hover cursor-pointer outline-none">
            <div className="flex items-center gap-2">
              <Avatar name="Анна Петрова" size={28} />
              <div className="text-[12.5px] font-medium leading-tight">
                Анна Петрова
              </div>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem 
            onClick={() => signOut()}
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