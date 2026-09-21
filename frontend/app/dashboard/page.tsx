import { DashboardPageView, DashboardPageViewProps } from "@/views/dashboard";
import { dashboardMock } from "./dashboard.mock";

export type CurrentDateInfo = {
  greeting: string;
  weekDay: string;
  day: string;
  month: string;
  year: number;
  hours: string;
  minutes: string;
};

export default async function DashboardPage() {

  return <DashboardPageView {...dashboardMock} />;
}
