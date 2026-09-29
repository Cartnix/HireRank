"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";

const emptySubscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useIsClient();

  if (!mounted) {
    return <div className="h-9 w-full rounded-md bg-muted animate-pulse" />;
  }

  const isDark = theme === "dark";

  return (
    <div 
      className="flex items-center justify-between w-full px-2 py-1.5 text-sm outline-none cursor-pointer select-none rounded-sm transition-colors hover:bg-accent hover:text-accent-foreground"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <span className="flex items-center gap-2 font-medium text-foreground">
        {isDark ? <Moon className="h-4 w-4 text-blue-400" /> : <Sun className="h-4 w-4 text-amber-500" />}
        Тема
      </span>
      
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setTheme(isDark ? "light" : "dark");
        }}
        aria-label="Сменить тему"
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          isDark ? "bg-primary" : "bg-input"
        }`}
      >
        <span
          className={`pointer-events-none flex h-4 w-4 items-center justify-center rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out ${
            isDark ? "translate-x-4" : "translate-x-0"
          }`}
        >
          {isDark ? (
            <Moon className="h-2.5 w-2.5 text-blue-500" />
          ) : (
            <Sun className="h-2.5 w-2.5 text-amber-500" />
          )}
        </span>
      </button>
    </div>
  );
}