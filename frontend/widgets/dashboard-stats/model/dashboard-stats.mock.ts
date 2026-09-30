interface StatMetrics {
  activeJobsCount: number;
  inProgressCandidates: number;
  todaysInterviewsCount: number;
  avgTimeToHire: number;
}

interface DashboardStatsWithPrevious extends StatMetrics {
  previousMonth: StatMetrics;
}

export const statsMock: DashboardStatsWithPrevious = { activeJobsCount: 0, inProgressCandidates: 0, todaysInterviewsCount: 0, avgTimeToHire: 0, previousMonth: { activeJobsCount: 0, inProgressCandidates: 0, todaysInterviewsCount: 0, avgTimeToHire: 0 } };
