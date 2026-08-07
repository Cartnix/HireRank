import { Stage } from "@/entities/job";
import { Card } from "@/shared/ui/card";

export function HiringFunnel({ pipelineCounts, maxPipeline }: { pipelineCounts: { stage: Stage; count: number }[]; maxPipeline: number }) {
  return (
    <Card className="col-span-2 p-6">
      <div className="mb-5 text-[15px] font-semibold">Воронка найма</div>
      <div className="space-y-4">
        {pipelineCounts.map((p) => (
          <div key={p.stage}>
            <div className="mb-1.5 flex items-center justify-between text-[13px]">
              <span className="font-medium text-foreground">{p.stage}</span>
              <span className="text-foreground-secondary">{p.count} чел.</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand-primary"
                style={{ width: `${(p.count / maxPipeline) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
