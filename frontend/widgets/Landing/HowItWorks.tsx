"use client"

import { motion } from "framer-motion"

const steps = [
    { title: "Добавьте вакансию", desc: "Опишите роль и требования — система сразу готова принимать отклики." },
    { title: "Кандидаты приходят сами", desc: "Карточки появляются на канбане по мере отклика, без ручного ввода." },
    { title: "Команда решает вместе", desc: "Комментарии, оценки и статус — в одном месте, видно всем причастным." },
]

export const HowItWorks = () => (
    <section className="relative py-28 px-6">
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground text-center mb-16">
                От вакансии до найма — три шага
            </h2>

            <div className="relative">
                {/* соединительная линия, как трек прогресса */}
                <div className="absolute left-1/2 top-2 bottom-2 w-px bg-border -translate-x-1/2 hidden md:block" />

                <div className="space-y-6">
                    {steps.map((s, i) => (
                        <motion.div
                            key={s.title}
                            initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-80px" }}
                            transition={{ duration: 0.5 }}
                            className="relative md:w-[46%]"
                            style={{ marginLeft: i % 2 === 0 ? "0" : "auto" }}
                        >
                            {/* точка на центральной линии */}
                            <div
                                className={`absolute top-7 w-3 h-3 rounded-full bg-brand-primary ring-4 ring-background hidden md:block ${
                                    i % 2 === 0 ? "-right-7.5" : "-left-7.5"
                                }`}
                            />

                            <div className="rounded-3xl p-7 bg-background-elevated border border-border-subtle shadow-sm hover:shadow-md transition-shadow duration-300">
                                <div className="flex items-center gap-2.5 mb-1">
                                    <span className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-semibold flex items-center justify-center">
                                        {i + 1}
                                    </span>
                                    <span className="text-xs font-medium text-brand-primary uppercase tracking-wide">
                                        Шаг {i + 1}
                                    </span>
                                </div>
                                <h3 className="text-lg font-medium text-foreground mt-2 mb-2">{s.title}</h3>
                                <p className="text-sm text-foreground-secondary leading-relaxed">{s.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    </section>
)