import type { Role } from "../model/types";

import { allowedTabs, tabs, type Tab } from "./constants";

export function CopilotTabs({
  role,
  tab,
  onChange,
}: {
  role: Role;
  tab: Tab;
  onChange: (next: Tab) => void;
}) {
  return (
    <nav
      aria-label="Разделы Copilot"
      className="flex flex-wrap gap-2 border-b border-border pb-4"
    >
      {tabs
        .filter((x) => allowedTabs[role].includes(x.id))
        .map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${tab === item.id ? "bg-brand-primary text-brand-primary-foreground" : "bg-card text-foreground-secondary hover:bg-accent"}`}
          >
            <item.icon size={16} />
            {item.title}
          </button>
        ))}
    </nav>
  );
}
