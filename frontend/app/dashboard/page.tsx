import { initialJobs } from "@/entities/job/model/data";
import { JobStatusBadge } from "@/entities/job/ui/JobStatus";
import { Avatar } from "@/shared/ui/avatar";
import { GhostButton } from "@/shared/ui/buttons/GhostButton";

export default function Dashboard() {
  return (
    <>
      <Avatar name="Ержан Абаев" size={120} />
      <GhostButton>text</GhostButton>
      {initialJobs.map((j) => (
        <JobStatusBadge status={j.status} />
      ))}
    </>
  );
}
