"use client";

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
    <article className="w-[min(22.5rem,calc(100vw-3rem))] shrink-0 rounded-3xl border border-border-subtle bg-background-elevated p-7 shadow-sm mx-3">
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
    </article>
)

export const Testimonial = () => {
    return (
        <section className="relative py-28 overflow-hidden">
            <div
                className="testimonial-viewport relative w-full"
                aria-label="Отзывы клиентов"
                style={{
                    maskImage:
                        "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
                    WebkitMaskImage:
                        "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
                }}
            >
                <div className="testimonial-track flex w-max">
                    {[0, 1].map((copy) => (
                        <div
                            key={copy}
                            aria-hidden={copy === 1}
                            className="flex shrink-0"
                        >
                            {testimonials.map((t) => (
                                <Card key={`${copy}-${t.name}`} t={t} />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .testimonial-track {
                    animation: testimonial-marquee 36s linear infinite;
                    will-change: transform;
                }
                .testimonial-viewport:hover .testimonial-track,
                .testimonial-viewport:focus-within .testimonial-track {
                    animation-play-state: paused;
                }
                @keyframes testimonial-marquee {
                    to {
                        transform: translateX(-50%);
                    }
                }
                @media (prefers-reduced-motion: reduce) {
                    .testimonial-viewport {
                        overflow-x: auto;
                        mask-image: none !important;
                        -webkit-mask-image: none !important;
                    }
                    .testimonial-track {
                        animation: none;
                        will-change: auto;
                    }
                }
            `}</style>
        </section>
    )
}
