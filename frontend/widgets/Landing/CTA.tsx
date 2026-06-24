// components/CTA.tsx
export const CTA = () => (
    <section className="relative py-32 px-6">
        <div className="relative rounded-[2.5rem] max-w-3xl mx-auto p-12 text-center bg-background-elevated border border-border-subtle shadow-sm overflow-hidden">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-brand-primary/10 blur-3xl pointer-events-none" />

            <h2 className="relative text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                Наведите порядок в найме сегодня
            </h2>
            <p className="relative mt-3 text-foreground-secondary">
                Бесплатно для команд до 5 вакансий. Карта не нужна.
            </p>
            <button className="relative mt-8 px-7 py-3.5 rounded-full font-medium text-brand-primary-foreground bg-brand-primary hover:bg-brand-primary-hover transition-all duration-200 hover:scale-[1.03] shadow-sm">
                Начать бесплатно
            </button>
        </div>
    </section>
)