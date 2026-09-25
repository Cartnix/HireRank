import Link from "next/link";
import { Card } from "@/shared/ui/card";

export const CTA = () => (
  <section className="relative py-32 px-6 flex justify-center">
    <Card className="w-1/2">
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-brand-primary/10 blur-3xl pointer-events-none" />

      <h2 className="relative text-foreground">
        Получите разобранного AI кандидата вместо обхода кабинетов
      </h2>

      <p className="relative mt-3 text-foreground-secondary">
        Оператор вводит резюме один раз. HR выбирает действие и подтверждает его.
      </p>

      <Link href="/dashboard/copilot" className="relative mt-8 inline-block rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-brand-primary-foreground">Попробовать сценарий →</Link>
    </Card>
  </section>
);
