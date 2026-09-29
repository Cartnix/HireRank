import type { Candidate } from "@/entities/candidate";
import type { Job } from "@/entities/job";
import type { Interview } from "@/entities/interview";
import { StatsWidgets } from "@/widgets/dashboard-stats";
import { SectionTitle } from "@/shared/ui/SectionTitle";
import { CurrentDateInfo } from "@/app/dashboard/page";
import { HiringVelocityCard } from "@/widgets/candidates-grow/ui/CandidateVelocityChart";
import { HiringFunnelCard } from "@/widgets/candidate-funnel";
import { UpcomingInterviewsCard } from "@/widgets/upcoming-interviews/ui/UpcomingInterviewsCard";
import { TopCandidatesCard } from "@/widgets/top-candidate";

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <div className="lg:col-span-7 xl:col-span-8">
          <HiringVelocityCard />
        </div>

        <div className="lg:col-span-5 xl:col-span-4">
          <HiringFunnelCard />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <div className="lg:col-span-7 xl:col-span-8">
          <TopCandidatesCard />
        </div>

        <div className="lg:col-span-5 xl:col-span-4">
          <UpcomingInterviewsCard />
        </div>
      </div>
    </div>
  );
}
