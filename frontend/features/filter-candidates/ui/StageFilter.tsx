import { Filter } from "lucide-react";

export function StageFilter({
  value,
  onChange,
  stages,
}: {
  value: string;
  onChange: (v: string | "Все") => void;
  stages: string[];
}) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto">
      <Filter size={14} className="mr-0.5 shrink-0 text-muted-foreground" />
      {["Все", ...stages].map((stage) => (
        <button
          key={stage}
          onClick={() => onChange(stage)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
            value === stage
              ? "bg-brand-primary text-brand-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          {stage}
        </button>
      ))}
    </div>
  );
}
