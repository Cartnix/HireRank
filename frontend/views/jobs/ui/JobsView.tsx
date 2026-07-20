import { Plus } from "lucide-react";
import { Job, Stage } from "@/entities/job";
import { Candidate } from "@/entities/candidate";
import { SectionTitle } from "@/shared/ui/SectionTitle";
import { MainButton } from "@/shared/ui/buttons/MainButton";
import { JobsTable } from "@/widgets/job-table";
import { JobOverview } from "@/widgets/job-overview/ui/JobOverview";

export const JobsView = ({
  jobs,
  candidates,
  selectedJob,
  onOpenJob,
  onBack,
  onCreateJob,
  onUpdateStages,
  onOpenCandidate,
}: {
  jobs: Job[];
  candidates: Candidate[];
  selectedJob: Job | null;
  onOpenJob: (id: string) => void;
  onBack: () => void;
  onCreateJob: () => void;
  onUpdateStages: (stages: Stage[]) => void;
  onOpenCandidate: (id: string) => void;
}) => {
  if (selectedJob) {
    return (
      <JobOverview
        job={selectedJob}
        candidates={candidates.filter((c) => c.jobId === selectedJob.id)}
        onBack={onBack}
        onUpdateStages={onUpdateStages}
        onOpenCandidate={onOpenCandidate}
      />
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <SectionTitle
          title="Вакансии"
          subtitle={`${jobs.length} позиций всего`}
        />
        <MainButton onClick={onCreateJob} title="Создать вакансию">
          icon={<Plus size={15} />}
        </MainButton>
      </div>

      <JobsTable jobs={jobs} candidates={candidates} onOpenJob={onOpenJob} />
    </div>
  );
};
