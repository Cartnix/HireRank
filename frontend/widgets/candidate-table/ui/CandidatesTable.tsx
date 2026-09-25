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
    <Card>
      <table className="w-full text-left text-[13.5px]">
        <thead>
          <tr className="border-b border-border text-[12px] uppercase tracking-wide text-muted-foreground">
            <th className="px-5 py-3 font-medium">Кандидат</th>
            <th className="px-5 py-3 font-medium">Вакансия</th>
            <th className="px-5 py-3 font-medium">Этап</th>
            <th className="px-5 py-3 font-medium">Образование</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c) => {
            const fullName = getCandidateFullName(c);
            const job = c.assigned_vacancy_id ? jobById[c.assigned_vacancy_id] : null;
            const specialty = c.questionnaire.education[0]?.specialty ?? "—";

            return (
              <tr
                key={c.id}
                onClick={() => onOpenCandidate(c.id)}
                className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/60"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={fullName} size={30} />
                    <span className="font-medium">{fullName}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-foreground-secondary">{job?.title ?? "—"}</td>
                <td className="px-5 py-3">
                  <StageBadge stage={c.status} />
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
    </Card>
  );
}