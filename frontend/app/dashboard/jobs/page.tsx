// import { getCandidates } from "@/entities/candidate";
// import { getJobs, initialJobs, Job } from "@/entities/job";
// import { JobsView } from "@/views/jobdView";
// import { useMemo, useState } from "react";

// export default async function Page() {
//   const [candidates, jobs] = await Promise.all([getCandidates(), getJobs()]);
//   const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
//   const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
//     null,
//   );
//   const [showNewModal, setShowNewJobmodal] = useState(false);
//   const [jobs, setJobs] = useState<jobs[]>(initialJobs);

//   const selectedJob = selectedJobId ? jobById[selectedJobId] : null;
//   const jobById = useMemo(() => {
//     const map: Record<string, Job> = {};
//     jobs.forEach((j) => map[j.id]);
//     return map;
//   }, [jobs]);

//   return (
//     <JobsView
//       jobs={jobs}
//       candidates={candidates}
//       selectedJob={selectedJob}
//       onOpenJob={setSelectedJobId}
//       onBack={() => setSelectedJobId(null)}
//       onCreateJob={() => setShowNewJobmodal(true)}
//       onUpdateStages={(stages) =>
//         setJobs((prev) =>
//           prev.map((j) => (j.id === selectedJob?.id ? { ...j, stages } : j)),
//         )
//       }
//       onOpenCandidate={(id) => {
//         setSelectedCandidateId(id);
//         setView("candidates");
//       }}
//     />
//   );
// }
