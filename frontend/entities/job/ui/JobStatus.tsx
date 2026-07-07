import { JobStatus } from "../model/types";

const jobStatusColor: Record<JobStatus, string> = {
  Открыта: "bg-success/15 text-success",
  "На паузе": "bg-warning/15 text-warning",
  Закрыта: "bg-muted text-muted-foreground",
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium ${jobStatusColor[status]}`}>
      {status}
    </span>
  );
}
