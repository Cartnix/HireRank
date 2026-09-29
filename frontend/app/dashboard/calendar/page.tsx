import { SectionTitle } from "@/shared/ui/SectionTitle";
import { CalendarGrid } from "@/widgets/calendar-grid";

export default function CalendarPage() {
  return (
    <main className="px-15">
      <SectionTitle
        title="Календарь"
        subtitle="Расписание собеседований и занятость рекрутеров"
      />
      <CalendarGrid candidateById={{}} />
    </main>
  );
}
