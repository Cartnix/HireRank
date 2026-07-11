import { Avatar } from "@/shared/ui/avatar";
import { navItems, View } from "@/shared/utils/navigation";

export function Sidebar({
  view,
  onNavigate,
}: {
  view: View;
  onNavigate: (v: View) => void;
}) {
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
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-left text-[14px] font-medium transition-colors ${
                active
                  ? "bg-brand-primary text-brand-primary-foreground"
                  : "text-foreground-secondary hover:bg-muted"
              }`}
            >
              <Icon size={17} strokeWidth={2} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center justify-between rounded-[10px] border border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Avatar name="Анна Петрова" size={28} />
          <div className="text-[12.5px] font-medium leading-tight">
            Анна Петрова
          </div>
        </div>
      </div>
    </aside>
  );
}
