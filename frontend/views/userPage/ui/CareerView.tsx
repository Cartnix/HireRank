"use client";
import Link from "next/link";

import { MainButton } from "@/shared/ui/buttons/MainButton";
import { useAuth } from "@/features/auth/useAuth";
import { useRouter } from "next/router";

export const CareerView = () => {
  const mockVacancies = [
    {
      id: "1",
      title: "Frontend Developer",
      department: "Engineering",
      location: "Удаленно",
      type: "Полная занятость",
      summary:
        "Разрабатываем интерфейсы для продукта и улучшаем пользовательский опыт.",
    },
    {
      id: "2",
      title: "Backend Developer",
      department: "Engineering",
      location: "Гибрид",
      type: "Полная занятость",
      summary: "Работаем над API, интеграциями и надежной серверной логикой.",
    },
  ];

  const router = useRouter();
  const { signOut, isLoading } = useAuth();

  const handleSignOut = async () => {
    const error = await signOut();
    if (!error) {
      router.push("/auth"); 
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background-elevated/70 p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-primary">
              Карьера
            </p>
            <h1 className="text-2xl font-semibold">Открытые вакансии</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Выберите подходящую роль и отправьте отклик — мы рассмотрим его в
              ближайшее время.
            </p>
          </div>

          <MainButton
            onClick={signOut}
            title="Выйти"
            className="w-full sm:w-auto"
          />
        </header>

        <div className="grid gap-4">
          {mockVacancies.map((vacancy) => (
            <article
              key={vacancy.id}
              className="rounded-2xl border border-border bg-background-elevated p-5 shadow-sm transition-all hover:border-brand-primary/30 hover:shadow-md"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{vacancy.title}</h2>
                    <span className="rounded-full bg-brand-primary/10 px-2.5 py-1 text-xs font-medium text-brand-primary">
                      {vacancy.type}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {vacancy.department} • {vacancy.location}
                  </p>
                  <p className="max-w-2xl text-sm text-muted-foreground/90">
                    {vacancy.summary}
                  </p>
                </div>

                <Link
                  href={`/careers/${vacancy.id}`}
                  className="inline-flex items-center justify-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-brand-primary-foreground transition-opacity hover:opacity-90"
                >
                  Откликнуться
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};
