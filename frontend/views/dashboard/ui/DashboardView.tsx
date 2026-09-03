import type { Candidate } from "@/entities/candidate";
import type { Job } from "@/entities/job";
import type { Interview } from "@/entities/interview";
import { StatsWidgets } from "@/widgets/dashboard-stats";
import { HiringFunnel } from "@/widgets/hiring-panel";
import { UpcomingPanel } from "@/widgets/upcoming-panel/ui/UpcomingPanel";
import { SectionTitle } from "@/shared/ui/SectionTitle";
import CandidateGrowChart from "@/widgets/candidates-grow/ui/CandidatesGrowChart";
import { CurrentDateInfo } from "@/app/dashboard/page";

export type DashboardPageViewProps = {
  currentDate: CurrentDateInfo;
  activeJobsCount: number;
  inProgressCandidates: number;
  todaysInterviewsCount: number;
  pipelineCounts: { stage: string; count: number }[];
  maxPipeline: number;
  todaysInterviews: Interview[];
  avgTimeToHire: number;
  candidateById: Record<string, Candidate>;
  jobById: Record<string, Job>;
};

export function DashboardPageView(props: DashboardPageViewProps) {
  return (
    <div className="px-15">
      <SectionTitle title="Главная" subtitle="Обзор рекрутинга на сегодня" />

      <StatsWidgets
        active_vacancies={props.activeJobsCount}
        candidates_total={props.inProgressCandidates}
        interviews_scheduled={props.todaysInterviewsCount}
        avg_time_to_hire={props.avgTimeToHire}
      />

      <CandidateGrowChart />

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