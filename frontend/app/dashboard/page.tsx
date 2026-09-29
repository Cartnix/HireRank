import { DashboardClient } from "@/views/dashboard/ui/DashboardClient";

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

  return <DashboardClient />;
}
