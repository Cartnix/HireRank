import { AnalyticsOverview } from "./AnalyticsOverview";
import type { DashboardAnalytics } from "@/widgets/dashboard-stats/model/analytics";
import type { Candidate } from "@/entities/candidate";
import type { Job } from "@/entities/job";
import type { Interview } from "@/entities/interview";
import { StatsWidgets } from "@/widgets/dashboard-stats";
import { SectionTitle } from "@/shared/ui/SectionTitle";
import { CurrentDateInfo } from "@/app/dashboard/page";

export type DashboardStats = {
  activeJobsCount: number;
  inProgressCandidates: number;
  todaysInterviewsCount: number;
  avgTimeToHire: number;
};

export type DashboardPageViewProps = DashboardStats & {
  analytics?: DashboardAnalytics;
  candidateLink?: (id: string) => string;
  live?: boolean; candidateLabel?: string; demoActiveJobs?: boolean; demoCandidates?: boolean;
  currentDate?: CurrentDateInfo;
  previousMonth?: DashboardStats;
  pipelineCounts?: { stage: string; count: number }[];
  maxPipeline?: number;
  todaysInterviews?: Interview[];
  candidateById?: Record<string, Candidate>;
  jobById?: Record<string, Job>;
};

export function DashboardPageView(props: DashboardPageViewProps) {
  return (
    <div className="px-6 md:px-10 lg:px-15 space-y-8 pb-12">
      <SectionTitle title="Главная" subtitle="Обзор рекрутинга на сегодня" />

      <StatsWidgets
        activeJobsCount={props.activeJobsCount}
        inProgressCandidates={props.inProgressCandidates}
        todaysInterviewsCount={props.todaysInterviewsCount}
        avgTimeToHire={props.avgTimeToHire}
        previousMonth={props.live ? undefined : props.previousMonth}
        analytics={props.analytics} live={props.live} candidateLabel={props.candidateLabel} demoActiveJobs={props.demoActiveJobs} demoCandidates={props.demoCandidates}
      />

      {props.analytics && <AnalyticsOverview data={props.analytics} candidateLink={props.candidateLink} />}

    </div>
  );
}
