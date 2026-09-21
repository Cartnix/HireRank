interface StatMetrics {
  activeJobsCount: number;
  inProgressCandidates: number;
  todaysInterviewsCount: number;
  avgTimeToHire: number;
}

interface DashboardStatsWithPrevious extends StatMetrics {
  previousMonth: StatMetrics;
}

export const statsMock: DashboardStatsWithPrevious = {
  activeJobsCount: 12,
  inProgressCandidates: 48,
  todaysInterviewsCount: 7,
  avgTimeToHire: 15,
  previousMonth: {
    activeJobsCount: 10,
    inProgressCandidates: 52,
    todaysInterviewsCount: 7,
    avgTimeToHire: 18,
  },
};