import { Filter } from "lucide-react";
import { Stage, allStages } from "@/entities/job";

export function StageFilter({
  value,
  onChange,
}: {
  value: Stage | "Все";
  onChange: (v: Stage | "Все") => void;
}) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto">
      <Filter size={14} className="mr-0.5 shrink-0 text-muted-foreground" />
      {(["Все", ...allStages] as (Stage | "Все")[]).map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
            value === s
              ? "bg-brand-primary text-brand-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
