import type { ReactNode } from "react";

export function SectionTitle({
  title,
  subtitle,
  action,
  badge = "Overview",
  variant = "card",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  badge?: string;
  variant?: "card" | "plain";
}) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-4 ${variant === "card" ? "rounded-2xl border border-border/80 bg-gradient-to-r from-card via-card to-brand-primary/5 p-4 shadow-sm sm:p-5" : ""}`}>
      <div>
        {variant === "card" && (
          <div className="inline-flex items-center rounded-full border border-brand-primary/20 bg-brand-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-primary">
            {badge}
          </div>
        )}
        <div className={`${variant === "card" ? "mt-3" : ""} text-[26px] font-bold tracking-tight text-foreground`}>{title}</div>
        {subtitle && <div className="mt-1 text-[14px] text-foreground-secondary">{subtitle}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
