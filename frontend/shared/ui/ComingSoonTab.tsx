"use client";

import { useState } from "react";
import { Construction } from "lucide-react";

interface ComingSoonTabProps {
  label: string;
  icon?: React.ReactNode;
}

export function ComingSoonTab({ label, icon }: ComingSoonTabProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        aria-disabled="true"
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-secondary/30 text-foreground-secondary/50 border border-border/40 cursor-not-allowed select-none overflow-hidden relative group"
      >
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,#000_25%,transparent_25%,transparent_50%,#000_50%,#000_75%,transparent_75%,transparent)] bg-size-[8px_8px]" />

        {icon && <span className="opacity-40">{icon}</span>}
        <span className="relative z-10">{label}</span>

        <span className="relative z-10 ml-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-warning/10 text-warning border border-warning/20">
          WIP
        </span>
      </div>

      {showTooltip && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 rounded-lg bg-card border border-border shadow-xl text-[11px] text-foreground font-medium whitespace-nowrap z-50 flex items-center gap-1.5 animate-in fade-in-50 zoom-in-95">
          <Construction className="w-3.5 h-3.5 text-warning" />
          <span>Раздел находится в разработке</span>
        </div>
      )}
    </div>
  );
}
