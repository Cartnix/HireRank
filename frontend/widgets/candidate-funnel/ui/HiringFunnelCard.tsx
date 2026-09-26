import { Card } from "@/shared/ui/card";
import { funnelStages } from "../model/candidate-funnel.mock";

export function HiringFunnelCard() {
  return (
    <Card className="p-6 bg-card border border-border rounded-2xl flex flex-col justify-between h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground tracking-tight m-0">
            Воронка найма
          </h3>
          <p className="text-sm text-foreground-secondary mt-0.5 mb-0">
            Распределение кандидатов по этапам
          </p>
        </div>
      </div>

      <div className="space-y-6 my-auto">
        {funnelStages.map((stage) => (
          <div key={stage.id} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{stage.name}</span>
              <span className="font-semibold text-foreground">
                {stage.count}
              </span>
            </div>

            <div className="h-3 w-full bg-secondary rounded-full overflow-hidden p-0.5 border border-border/50">
              <div
                className={`h-full rounded-full transition-all duration-500 shadow-sm ${stage.colorClass}`}
                style={{ width: `${stage.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-2" />
    </Card>
  );
}