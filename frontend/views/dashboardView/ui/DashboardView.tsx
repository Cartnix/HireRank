import { Candidate } from "@/entities/candidate";
import { Interview } from "@/entities/interview";
import { Job, Stage } from "@/entities/job";
import { SectionTitle } from "@/shared/ui/sectionTitle";
import { StatsWidgets } from "@/widgets/dashboard-stats";
import { HiringFunnel } from "@/widgets/hiring-panel";
import { UpcomingPanel } from "@/widgets/upcoming-panel/ui/UpcomingPanel";

export const DashboardPage = ({
  activeJobsCount,
  inProgressCandidates,
  todaysInterviewsCount,
  pipelineCounts,
  maxPipeline,
  todaysInterviews,
  candidateById,
  jobById,
}: {
  activeJobsCount: number;
  inProgressCandidates: number;
  todaysInterviewsCount: number;
  pipelineCounts: { stage: Stage; count: number }[];
  maxPipeline: number;
  todaysInterviews: Interview[];
  candidateById: Record<string, Candidate>;
  jobById: Record<string, Job>;
}) => {
  return (
    <div>
      <SectionTitle title="Главная" subtitle="Обзор рекрутинга на сегодня" />

      <StatsWidgets
        activeJobsCount={activeJobsCount}
        inProgressCandidates={inProgressCandidates}
        todaysInterviewsCount={todaysInterviewsCount}
      />

      <div className="grid grid-cols-3 gap-4">
        <HiringFunnel
          pipelineCounts={pipelineCounts}
          maxPipeline={maxPipeline}
        />
        <UpcomingPanel
          todaysInterviews={todaysInterviews}
          candidateById={candidateById}
          jobById={jobById}
        />
      </div>
    </div>
  );
};
