"use client";

import { useDemo } from "@/features/demo/DemoProvider";
import { DemoBadge } from "@/shared/ui/badges/DemoBadge";
import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, X } from "lucide-react";

import {
  COPILOT_STATE_EVENT,
  COPILOT_STORAGE_KEY,
  loadCopilotState,
  saveCopilotState,
} from "@/features/hr-copilot/model/storage";
import type { CopilotState, Notification } from "@/features/hr-copilot/model/types";

function formatDate(value: string) {
  const [date = "", time = ""] = value.split("T");
  return `${date.split("-").reverse().join(".")} · ${time.slice(0, 5)}`;
}

export function DashboardNotifications() {
  const demo = useDemo();
  const [state, setState] = useState<CopilotState | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const syncState = () => setState(loadCopilotState());
    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === COPILOT_STORAGE_KEY) syncState();
    };
    const frame = window.requestAnimationFrame(syncState);

    window.addEventListener(COPILOT_STATE_EVENT, syncState);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener(COPILOT_STATE_EVENT, syncState);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const tenantId = state?.tenants[0]?.id;
  const notifications = state?.notifications.filter(
    (item) => item.tenantId === tenantId && item.role === demo.role && (demo.role !== "manager" || state.candidates.some(c => c.id === item.candidateId && c.vacancyId === "v-design")),
  ) ?? [];
  const unreadCount = notifications.filter((item) => !item.read).length;

  const markRead = (id: string) => {
    if (!state || !tenantId) return;
    const next = structuredClone(state);
    const notification = next.notifications.find(
      (item) => item.id === id && item.tenantId === tenantId,
    );
    if (!notification) return;
    notification.read = true;
    saveCopilotState(next);
    setState(next);
  };

  const markAllRead = () => {
    if (!state || !tenantId || !unreadCount) return;
    const next = structuredClone(state);
    next.notifications.forEach((item) => {
      if (notifications.some(n => n.id === item.id)) item.read = true;
    });
    saveCopilotState(next);
    setState(next);
  };

  if (!state || !demo.enabled) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <span className="absolute bottom-0 right-16 whitespace-nowrap"><DemoBadge label="Dev mode" /></span>
      <section
        id="dashboard-notifications-panel"
        role="dialog"
        aria-label="Уведомления"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`absolute bottom-16 right-0 flex max-h-[min(34rem,calc(100dvh-7rem))] w-[min(22rem,calc(100vw-2.5rem))] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/15 transition-[opacity,transform] duration-200 ease-out ${
          isOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-2 scale-95 opacity-0"
        }`}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Уведомления</h2><DemoBadge />
            <p className="mt-0.5 text-xs text-muted-foreground">
              {unreadCount ? `${unreadCount} непрочитанных` : "Все просмотрены"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                title="Прочитать все"
                aria-label="Прочитать все уведомления"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <CheckCheck size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              title="Закрыть"
              aria-label="Закрыть уведомления"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="min-h-0 overflow-y-auto p-2">
          {notifications.length ? (
            <ul className="space-y-1">
              {notifications.map((item: Notification) => (
                <li
                  key={item.id}
                  className={`flex items-start gap-3 rounded-xl px-3 py-3 transition-colors ${
                    item.read ? "" : "bg-brand-primary/5"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      item.read ? "bg-transparent" : "bg-brand-primary"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-5 text-foreground">{item.text}</p>
                    <time
                      dateTime={item.createdAt}
                      className="mt-1 block text-[11px] text-muted-foreground"
                    >
                      {formatDate(item.createdAt)}
                    </time>
                  </div>
                  {!item.read && (
                    <button
                      type="button"
                      onClick={() => markRead(item.id)}
                      title="Прочитано"
                      aria-label="Отметить уведомление как прочитанное"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                    >
                      <Check size={15} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-10 text-center">
              <Bell size={22} className="mx-auto text-muted-foreground/60" />
              <p className="mt-3 text-sm font-medium text-foreground">Пока тихо</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Новые события появятся здесь.
              </p>
            </div>
          )}
        </div>
      </section>

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Закрыть уведомления" : "Открыть уведомления"}
        aria-expanded={isOpen}
        aria-controls="dashboard-notifications-panel"
        title="Уведомления"
        className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-brand-primary text-brand-primary-foreground shadow-lg shadow-brand-primary/25 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
      >
        <Bell size={21} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-danger px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
