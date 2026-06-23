export const CTA = () => (
    <section className="relative py-32 px-6">
        <div className="glass rounded-[2.5rem] max-w-3xl mx-auto p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                Наведите порядок в найме сегодня
            </h2>
            <p className="mt-3 text-foreground/60">
                Бесплатно для команд до 5 вакансий. Карта не нужна.
            </p>
            <button
                className="mt-8 px-7 py-3.5 rounded-full font-medium text-white transition-transform duration-200 hover:scale-[1.03]"
                style={{ background: "var(--accent)" }}
            >
                Начать бесплатно
            </button>
        </div>
    </section>
)