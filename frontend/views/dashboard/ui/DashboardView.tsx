import type { Candidate } from "@/entities/candidate";
import type { Job, Stage } from "@/entities/job";
import type { Interview } from "@/entities/interview";
import { StatsWidgets } from "@/widgets/dashboard-stats";
import { HiringFunnel } from "@/widgets/hiring-panel";
import { UpcomingPanel } from "@/widgets/upcoming-panel/ui/UpcomingPanel";
import { SectionTitle } from "@/shared/ui/SectionTitle";

export type DashboardPageViewProps = {
  activeJobsCount: number;
  inProgressCandidates: number;
  todaysInterviewsCount: number;
  pipelineCounts: { stage: Stage; count: number }[];
  maxPipeline: number;
  todaysInterviews: Interview[];
  candidateById: Record<string, Candidate>;
  jobById: Record<string, Job>;
};

export function DashboardPageView(props: DashboardPageViewProps) {
  return (
    <div>
      <SectionTitle title="Главная" subtitle="Обзор рекрутинга на сегодня" />

      <StatsWidgets
        activeJobsCount={props.activeJobsCount}
        inProgressCandidates={props.inProgressCandidates}
        todaysInterviewsCount={props.todaysInterviewsCount}
      />

      <div className="grid grid-cols-3 gap-4">
        <HiringFunnel
          pipelineCounts={props.pipelineCounts}
          maxPipeline={props.maxPipeline}
        />
        <UpcomingPanel
          todaysInterviews={props.todaysInterviews}
          candidateById={props.candidateById}
          jobById={props.jobById}
        />
      </div>
    </div>
  );
}