import type { Candidate } from "@/entities/candidate";
import type { Job } from "@/entities/job";
import type { Interview } from "@/entities/interview";
import { StatsWidgets } from "@/widgets/dashboard-stats";
import { HiringFunnel } from "@/widgets/hiring-panel";
import { UpcomingPanel } from "@/widgets/upcoming-panel/ui/UpcomingPanel";
import { SectionTitle } from "@/shared/ui/SectionTitle";
import CandidateGrowChart from "@/widgets/candidates-grow/ui/CandidatesGrowChart";
import { CurrentDateInfo } from "@/app/dashboard/page";

export type DashboardStats = {
  activeJobsCount: number;
  inProgressCandidates: number;
  todaysInterviewsCount: number;
  avgTimeToHire: number;
};

export type DashboardPageViewProps = DashboardStats & {
  currentDate: CurrentDateInfo;
  previousMonth: DashboardStats;
  pipelineCounts: { stage: string; count: number }[];
  maxPipeline: number;
  todaysInterviews: Interview[];
  candidateById: Record<string, Candidate>;
  jobById: Record<string, Job>;
};

interface StatsWidgetsProps {
  stats: DashboardStats;
  previousMonth: DashboardStats;
  className?: string;
}

export function DashboardPageView(props: DashboardPageViewProps) {
  return (
    <div className="px-6 md:px-10 lg:px-15 space-y-8 pb-12">
      <SectionTitle title="Главная" subtitle="Обзор рекрутинга на сегодня" />

      <StatsWidgets
        activeJobsCount={props.activeJobsCount}
        inProgressCandidates={props.inProgressCandidates}
        todaysInterviewsCount={props.todaysInterviewsCount}
        avgTimeToHire={props.avgTimeToHire}
        previousMonth={props.previousMonth}
      />

      <CandidateGrowChart />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="w-full">
          <HiringFunnel
            pipelineCounts={props.pipelineCounts}
            maxPipeline={props.maxPipeline}
          />
        </div>
        <div className="w-full">
          <UpcomingPanel
            todaysInterviews={props.todaysInterviews}
            candidateById={props.candidateById}
            jobById={props.jobById}
          />
        </div>
      </div>
    </div>
  );
}
