"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

/** Inspectors flow with the page so pointer position never traps page scrolling. */
export function DetailPanel({ id, title, onClose, children }: { id?: string; title: string; onClose: () => void; children: ReactNode }) {
  return (
    <aside id={id} aria-label={title} className="detail-panel overflow-hidden rounded-2xl shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-5 py-4">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <button
          type="button"
          aria-label={`Закрыть: ${title}`}
          onClick={onClose}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <X size={18} />
        </button>
      </header>
      <div className="min-w-0 p-5">{children}</div>
    </aside>
  );
}
