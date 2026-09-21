"use client";

import { useCurrentUser } from "@/shared/api/auth-store";
import { useCurrentDateTime } from "@/shared/utils/currentTime";

const Greeting = () => {
  const { hours } = useCurrentDateTime();
  const hour = Number(hours);

  if (hour >= 5 && hour < 12) return "Доброе утро";
  if (hour >= 12 && hour < 18) return "Добрый день";
  if (hour >= 18 && hour < 23) return "Добрый вечер";
  return "Доброй ночи";
};

export const DashboardHeader = () => {
  const { weekDay, month, day, year } = useCurrentDateTime();
  const dayPeriod = Greeting();

  const user = useCurrentUser();
  return (
    <header className="h-24.25 min-h-24.25 shrink-0 border-b border-border px-25 pt-8">
      <div className="text-foreground-secondary text-span">
        {weekDay}, {month} {day}, {year}
      </div>
      <div className="text-h3 font-bold">
        {dayPeriod}, {user?.first_name}
      </div>
    </header>
  );
};
