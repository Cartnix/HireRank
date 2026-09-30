import type { DashboardPageViewProps } from "@/views/dashboard";
// Empty state only. Test entities are supplied by the superuser-only developer API.
export const dashboardMock: DashboardPageViewProps = { activeJobsCount: 0, inProgressCandidates: 0, todaysInterviewsCount: 0, avgTimeToHire: 0 };
