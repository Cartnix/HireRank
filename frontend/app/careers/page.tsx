import Link from "next/link";

export default async function Page() {
  const mockVacancies = [
    { id: "1", title: "Frontend Developer", department: "Engineering", location: "Удаленно" },
    { id: "2", title: "Backend Developer", department: "Engineering", location: "Гибрид" },
  ];

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Открытые вакансии</h1>
          <form action="/auth/signout" method="post">
            <button className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
              Выйти
            </button>
          </form>
        </div>

        <div className="grid gap-4">
          {mockVacancies.map((vacancy) => (
            <div 
              key={vacancy.id}
              className="flex items-center justify-between rounded-xl border border-border bg-background-elevated p-5 transition-shadow hover:shadow-sm"
            >
              <div>
                <h3 className="text-lg font-semibold">{vacancy.title}</h3>
                <p className="text-sm text-muted-foreground">{vacancy.department} • {vacancy.location}</p>
              </div>
              <Link
                href={`/careers/${vacancy.id}`}
                className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-brand-primary-foreground transition-opacity hover:opacity-90"
              >
                Откликнуться
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}