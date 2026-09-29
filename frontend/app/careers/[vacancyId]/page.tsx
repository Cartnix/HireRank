import { CareerView } from "@/views/userPage";

export default async function CareerVacancyPage({
  params,
}: {
  params: Promise<{ vacancyId: string }>;
}) {
  const { vacancyId } = await params;
  return <CareerView vacancyId={vacancyId} />;
}
