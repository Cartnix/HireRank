import { MainButton } from "@/shared/ui/buttons/MainButton";
import { Card } from "@/shared/ui/Card";

export const CTA = () => (
  <section className="relative py-32 px-6 flex justify-center">
    <Card className="w-1/2">
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-brand-primary/10 blur-3xl pointer-events-none" />

      <h2 className="relative text-foreground">
        Наведите порядок в найме сегодня
      </h2>

      <p className="relative mt-3 text-foreground-secondary">
        Бесплатно для команд до 5 вакансий. Карта не нужна.
      </p>

      <MainButton title="Начать бесплатно" className="relative mt-8" />
    </Card>
  </section>
);
