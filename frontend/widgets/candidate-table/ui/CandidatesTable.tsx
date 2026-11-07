import { Candidate, getCandidateFullName, StageBadge } from "@/entities/candidate";
import { Job } from "@/entities/job";
import { Card } from "@/shared/ui/card";
import { Avatar } from "@/shared/ui/Avatar";

export function CandidatesTable({
  candidates,
  jobById,
  onOpenCandidate,
}: {
  candidates: Candidate[];
  jobById: Record<string, Job>;
  onOpenCandidate: (id: string) => void;
}) {
  return (
    <Card className="overflow-hidden p-0 shadow-sm hover:border-border hover:shadow-sm">
      <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] table-fixed text-left text-[13.5px]">
        <colgroup>
          <col className="w-[27%]" />
          <col className="w-[31%]" />
          <col className="w-[20%]" />
          <col className="w-[22%]" />
        </colgroup>
        <thead>
          <tr className="h-12 border-b border-border bg-muted/30 text-[11px] uppercase tracking-wide text-muted-foreground">
            <th className="px-5 py-3 font-semibold">Кандидат</th>
            <th className="px-5 py-3 font-semibold">Вакансия</th>
            <th className="px-5 py-3 font-semibold">Этап</th>
            <th className="px-5 py-3 font-semibold">Образование</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c) => {
            const fullName = getCandidateFullName(c);
            const job = c.assigned_vacancy_id ? jobById[c.assigned_vacancy_id] : null;
            const specialty = c.questionnaire.education[0]?.specialty ?? "—";
            const stage =
              c.stage ??
              ({
                unassigned: "Без назначения",
                assigned: "В работе",
                rejected: "Отклонён",
                pending_hitl: "Ожидает рассмотрения",
                action_applied: "Обработан",
              }[c.status] ?? c.status);

            return (
              <tr
                key={c.id}
                onClick={() => onOpenCandidate(c.id)}
                className="h-[68px] cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
              >
                <td className="px-5 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={fullName} size={30} />
                    <span className="truncate font-medium">{fullName}</span>
                  </div>
                </td>
                <td className="truncate px-5 py-3 text-foreground-secondary">{job?.title ?? "—"}</td>
                <td className="px-5 py-3">
                  <StageBadge stage={stage} />
                </td>
                <td className="px-5 py-3 text-foreground-secondary">{specialty}</td>
              </tr>
            );
          })}
          {candidates.length === 0 && (
            <tr>
              <td colSpan={4} className="px-5 py-8 text-center text-[13px] text-muted-foreground">
                Ничего не найдено. Попробуйте изменить фильтры.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </Card>
  );
}