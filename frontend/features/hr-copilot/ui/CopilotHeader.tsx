import { DemoBadge } from "@/shared/ui/badges/DemoBadge";
import { BrainCircuit } from "lucide-react";

import type { Role, CopilotState } from "../model/types";
import { inputClass, label } from "./constants";

export function CopilotHeader({
  state,
  tenantId,
  role,
  onTenantChange,
  onRoleChange,
}: {
  state: CopilotState;
  tenantId: string;
  role: Role;
  onTenantChange: (value: string) => void;
  onRoleChange: (value: Role) => void;
}) {
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-bold text-brand-primary">
            <BrainCircuit size={14} /> AI Agent · HITL + MCP <DemoBadge label="Демо · локальные данные" />
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            HireRank HR Copilot
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            рекрутер вводит резюме один раз → AI готовит Top‑3 → HR выбирает и
            подтверждает → только затем mock MCP выполняет действие.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="text-xs font-semibold">
            Компания
            <select
              aria-label="Компания"
              value={tenantId}
              onChange={(e) => onTenantChange(e.target.value)}
              className={`${inputClass} mt-1`}
            >
              {state.tenants.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold">
            Демо роль
            <select
              aria-label="Демо роль"
              value={role}
              onChange={(e) => onRoleChange(e.target.value as Role)}
              className={`${inputClass} mt-1`}
            >
              {(Object.keys(label) as Role[]).map((x) => (
                <option key={x} value={x}>
                  {label[x]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>
      <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-3 text-xs text-foreground-secondary">
        Интерактивное frontend демо. Сессия, JSON и mock MCP сохраняются только
        в браузере; роли и tenant здесь демонстрационные. Реальные резюме не
        загружайте.
      </div>
    </>
  );
}
