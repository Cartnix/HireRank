import {
  Bell,
  BrainCircuit,
  ClipboardList,
  FileUp,
  History,
} from "lucide-react";

import type { Action, Candidate, Role } from "../model/types";

export type Tab =
  | "copilot"
  | "intake"
  | "notifications"
  | "memory"
  | "audit";

export const label: Record<Role, string> = {
  hr: "HR",
  recruiter: "рекрутер бухгалтерии",
  manager: "Менеджер",
  candidate: "Кандидат",
  administrator: "Администратор",
};

export const actionLabel: Record<Action, string> = {
  interview: "На интервью",
  review: "Доп. рассмотрение",
  rejected: "Отклонить",
};

export const statusLabel: Record<Candidate["status"], string> = {
  new: "Новый · не обработан",
  assigned: "Назначен",
  review: "Доп. рассмотрение",
  interview: "Интервью",
  rejected: "Отклонён",
};

export const card = "rounded-2xl border border-border bg-card p-5 shadow-sm";
export const inputClass =
  "w-full rounded-xl border border-input bg-background-elevated px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand-primary";
export const primary =
  "rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-brand-primary-foreground hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50";
export const secondary =
  "rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-accent";

export const date = (value: string) => new Date(value).toLocaleString("ru-RU");
export const uid = () => crypto.randomUUID();
export const time = () => new Date().toISOString();

export const tabs: { id: Tab; title: string; icon: typeof BrainCircuit }[] = [
  { id: "copilot", title: "HR Copilot", icon: BrainCircuit },
  { id: "intake", title: "Приём резюме", icon: FileUp },
  { id: "notifications", title: "Уведомления", icon: Bell },
  { id: "memory", title: "Память", icon: ClipboardList },
  { id: "audit", title: "Аудит", icon: History },
];

export const allowedTabs: Record<Role, Tab[]> = {
  hr: [
    "copilot",
    "intake",
    "notifications",
    "memory",
    "audit",
  ],
  recruiter: ["intake", "notifications"],
  manager: ["notifications"],
  candidate: ["intake"],
  administrator: ["audit"],
};
