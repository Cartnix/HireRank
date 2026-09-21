import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export const getTrendBadge = (value: string | number, isPositive: boolean) => {
  const positive = typeof value === "number" ? value >= 0 : isPositive;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border ${
        positive
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
      }`}
    >
      {positive ? (
        <ArrowUpRight className="w-3 h-3" />
      ) : (
        <ArrowDownRight className="w-3 h-3" />
      )}
      {value}
    </span>
  );
};