import { RotateCcw } from "lucide-react";

import type { CopilotState } from "../../model/types";
import { date, secondary } from "../constants";
import { Section } from "../Section";

export function AuditTab({
  tenantId,
  state,
  onResetDemo,
}: {
  tenantId: string;
  state: CopilotState;
  onResetDemo: () => void;
}) {
  return (
    <Section title="Журнал действий" description="Видны только события текущего tenant; роли и вызовы MCP различаются.">
      <div className="mt-4 space-y-2">
        {state.audit
          .filter((x) => x.tenantId === tenantId)
          .map((x) => (
            <div key={x.id} className="rounded-xl border border-border p-3 text-xs">
              <strong>{x.action}</strong> · {x.actor} · {date(x.createdAt)}
              <div className="mt-1 text-muted-foreground">{x.detail}</div>
            </div>
          ))}
        <button onClick={onResetDemo} className={`${secondary} inline-flex items-center gap-2`}>
          <RotateCcw size={14} /> Сбросить демо
        </button>
      </div>
    </Section>
  );
}
