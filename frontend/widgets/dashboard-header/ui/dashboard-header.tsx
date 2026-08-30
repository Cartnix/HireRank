import { useCurrentDateTime } from "@/shared/utils/currentTime";

export const DashboardHeader = () => {
  const { weekDay, month, day, year } = useCurrentDateTime();
  return (
    <header className="h-24.25 min-h-24.25 shrink-0 border-b border-border px-10 pt-8">
      <div className="text-foreground-secondary text-span">
        {weekDay}, {month} {day}, {year}
      </div>
      <div className="text-h3 font-bold">Anna</div>
    </header>
  );
};
