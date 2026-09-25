import { Candidate } from "@/entities/candidate";
import { SectionTitle } from "@/shared/ui/SectionTitle";
import { CalendarGrid } from "@/widgets/calendar-grid";

export default function CalendarPage({
  candidateById,
}: {
  candidateById: Record<string, Candidate>;
}) {
  return (
    <main className="px-15">
      <SectionTitle
        title="Календарь"
        subtitle="Расписание собеседований и занятость рекрутеров"
      />
      <CalendarGrid candidateById={candidateById ?? {}} />
    </main>
  );
}
