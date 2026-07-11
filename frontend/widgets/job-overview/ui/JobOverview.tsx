import { ChevronLeft, MoreHorizontal } from "lucide-react";
import { Job, JobStatusBadge, Stage } from "@/entities/job";
import { Candidate, StageBadge } from "@/entities/candidate";
import { StagesEditor } from "@/features/manage-job-stages";
import { Card } from "@/shared/ui/card";
import { GhostButton } from "@/shared/ui/buttons/GhostButton";
import { Avatar } from "@/shared/ui/avatar";

export function JobOverview({
  job,
  candidates,
  onBack,
  onUpdateStages,
  onOpenCandidate,
}: {
  job: Job;
  candidates: Candidate[];
  onBack: () => void;
  onUpdateStages: (stages: Stage[]) => void;
  onOpenCandidate: (id: string) => void;
}) {
  return (
    <div>
      <button onClick={onBack} className="mb-5 flex items-center gap-1 text-[13px] font-medium text-foreground-secondary hover:text-foreground">
        <ChevronLeft size={15} /> Все вакансии
      </button>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="text-[26px] font-bold tracking-tight">{job.title}</div>
            <JobStatusBadge status={job.status} />
          </div>
          <div className="mt-1 text-[13.5px] text-foreground-secondary">
            {job.department} · {job.location} · {job.employmentType}
          </div>
        </div>
        <GhostButton icon={<MoreHorizontal size={15} />}>Действия</GhostButton>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <Card className="p-6">
            <div className="mb-3 text-[15px] font-semibold">Описание вакансии</div>
            <p className="mb-0 max-w-none text-[13.5px] leading-relaxed text-foreground-secondary">{job.description}</p>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-[15px] font-semibold">Кандидаты по вакансии ({candidates.length})</div>
            </div>
            <div className="divide-y divide-border">
              {candidates.length === 0 && (
                <div className="py-6 text-center text-[13px] text-muted-foreground">Пока нет кандидатов на эту позицию.</div>
              )}
              {candidates.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onOpenCandidate(c.id)}
                  className="flex cursor-pointer items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:opacity-80"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name} size={32} />
                    <div>
                      <div className="text-[13.5px] font-medium">{c.name}</div>
                      <div className="text-[12px] text-foreground-secondary">{c.source} · {c.appliedDate}</div>
                    </div>
                  </div>
                  <StageBadge stage={c.stage} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <StagesEditor stages={job.stages} onChange={onUpdateStages} />
      </div>
    </div>
  );
}
