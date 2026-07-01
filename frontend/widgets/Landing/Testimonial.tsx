"use client"

const testimonials = [
    {
        quote:
            "Раньше у нас было пять таблиц и забытые письма кандидатам. Теперь весь найм виден за один взгляд.",
        name: "Анна Соколова",
        role: "Head of HR, Nimbus Tech",
        initials: "АС",
    },
    {
        quote:
            "Закрываем вакансии быстрее на треть — никто больше не теряет отклики между почтой и таблицей.",
        name: "Дмитрий Орлов",
        role: "Talent Lead, Skyline Group",
        initials: "ДО",
    },
    {
        quote:
            "Нанимающие менеджеры сами смотрят на канбан, а не ждут, когда я пришлю выгрузку.",
        name: "Ирина Котова",
        role: "HRD, Vertex Studio",
        initials: "ИК",
    },
    {
        quote:
            "Внедрили за один день. Кандидаты больше не пишут «вы получили моё резюме?» — статус видно сразу.",
        name: "Олег Рябов",
        role: "Founder, Pochinka",
        initials: "ОР",
    },
]

const Card = ({ t }: { t: (typeof testimonials)[number] }) => (
    <div className="shrink-0 w-90 rounded-3xl bg-background-elevated border border-border-subtle shadow-sm p-7 mx-3">
        <p className="text-base text-foreground leading-relaxed">{t.quote}</p>
        <div className="mt-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-semibold flex items-center justify-center shrink-0">
                {t.initials}
            </div>
            <div className="text-sm text-foreground-secondary">
                <div className="font-medium text-foreground">{t.name}</div>
                <div className="text-xs">{t.role}</div>
            </div>
        </div>
    </div>
)

export const Testimonial = () => {
    const loop = [...testimonials, ...testimonials]

    return (
        <section className="relative py-28 overflow-hidden">
            <div
                className="relative w-full"
                style={{
                    maskImage:
                        "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
                    WebkitMaskImage:
                        "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
                }}
            >
                <div className="flex w-max marquee-track">
                    {loop.map((t, i) => (
                        <Card key={i} t={t} />
                    ))}
                </div>
            </div>

            <style jsx>{`
                .marquee-track {
                    animation: marquee 32s linear infinite;
                }
                @keyframes marquee {
                    from {
                        transform: translateX(0);
                    }
                    to {
                        transform: translateX(-50%);
                    }
                }
            `}</style>
        </section>
    )
}