import { Clock } from "lucide-react";

export const devBadge = (
  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20">
    <Clock className="w-3 h-3 animate-pulse" />
    Скоро
  </span>
);
