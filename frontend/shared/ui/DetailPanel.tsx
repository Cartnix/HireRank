"use client";

import { useState, useEffect, useRef, type ReactNode, type CSSProperties } from "react";
import { X, GripVertical } from "lucide-react";

/** Shared, independently scrollable inspector. Width is adjustable by pointer or keyboard. */
export function DetailPanel({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const [width, setWidth] = useState(720);
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const panel = panelRef.current;
    const dock = panel?.parentElement;
    if (!panel || !dock) return;
    if (window.matchMedia("(min-width: 1024px)").matches) {
      const panelBounds = panel.getBoundingClientRect();
      const dockBounds = dock.getBoundingClientRect();
      dock.scrollLeft += Math.max(0, panelBounds.right - dockBounds.right + 8);
    } else {
      panel.scrollIntoView({ block: "start", behavior: "instant" });
    }
  }, [width]);
  const clamp = (value: number) => Math.max(300, Math.min(720, value));
  return <aside ref={panelRef} aria-label={title} className="detail-panel" style={{ "--panel-width": `${width}px` } as CSSProperties}>
    <div role="separator" aria-label={`Ширина: ${title}`} aria-orientation="vertical" aria-valuemin={300} aria-valuemax={720} aria-valuenow={width} tabIndex={0}
      className="panel-resizer" onKeyDown={event => { if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) { event.preventDefault(); setWidth(value => event.key === "Home" ? 300 : event.key === "End" ? 720 : clamp(value + (event.key === "ArrowLeft" ? 24 : -24))); } }}
      onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.dataset.startX = String(event.clientX); event.currentTarget.dataset.startWidth = String(width); }}
      onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) setWidth(clamp(Number(event.currentTarget.dataset.startWidth) + Number(event.currentTarget.dataset.startX) - event.clientX)); }}
      onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}><GripVertical size={14} /></div>
    <header className="flex shrink-0 items-center justify-between gap-3 rounded-t-[15px] border-b border-border bg-card px-5 py-4"><span className="text-sm font-semibold">{title}</span><button type="button" aria-label={`Закрыть: ${title}`} onClick={onClose} className="rounded-lg p-2 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"><X size={18} /></button></header>
    <div className="min-h-0 overflow-y-auto overscroll-contain p-5">{children}</div>
  </aside>;
}
