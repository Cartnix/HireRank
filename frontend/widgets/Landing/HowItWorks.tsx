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
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 hidden md:block" />

                <div className="space-y-6">
                    {steps.map((s, i) => (
                        <motion.div
                            key={s.title}
                            initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-80px" }}
                            transition={{ duration: 0.5 }}
                            className={`glass rounded-3xl p-7 md:w-[46%] relative ${
                                i % 2 === 0 ? "md:mr-auto" : "md:ml-auto"
                            }`}
                        >
                            <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                                Шаг {i + 1}
                            </span>
                            <h3 className="text-lg font-medium text-foreground mt-1 mb-2">{s.title}</h3>
                            <p className="text-sm text-foreground/60 leading-relaxed">{s.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    </section>
)