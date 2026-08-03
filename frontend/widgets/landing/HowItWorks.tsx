"use client"

import { motion } from "framer-motion"

const steps = [
    {
        title: "Добавьте вакансию",
        desc: "Опишите роль и требования — система сразу готова принимать отклики.",
        visual: "form",
    },
    {
        title: "Кандидаты приходят сами",
        desc: "Карточки появляются на канбане по мере отклика, без ручного ввода.",
        visual: "kanban",
    },
    {
        title: "Команда решает вместе",
        desc: "Комментарии, оценки и статус — в одном месте, видно всем причастным.",
        visual: "thread",
    },
] as const

const FormVisual = () => (
    <div className="flex flex-col gap-1.5 w-full">
        {[
            { w: "70%", filled: true },
            { w: "45%", filled: true },
            { w: "85%", filled: false },
        ].map((line, idx) => (
            <motion.div
                key={idx}
                initial={{ width: 0 }}
                whileInView={{ width: line.w }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 + idx * 0.12, ease: "easeOut" }}
                className={`h-2 rounded-full ${
                    line.filled ? "bg-brand-primary/60" : "bg-border-subtle"
                }`}
            />
        ))}
    </div>
)

const KanbanVisual = () => (
    <div className="flex gap-2 w-full">
        {["Отклик", "Скрин", "Интервью"].map((col, ci) => (
            <div key={col} className="flex-1 flex flex-col gap-1.5">
                <span className="text-[9px] uppercase tracking-wide text-foreground-secondary/70">
                    {col}
                </span>
                <div className="rounded-lg border border-border-subtle bg-background h-14 p-1 flex flex-col gap-1 overflow-hidden">
                    {ci === 0 && (
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="h-4 rounded-md bg-brand-primary/15 border border-brand-primary/30"
                        />
                    )}
                    <div className="h-4 rounded-md bg-border-subtle/60" />
                </div>
            </div>
        ))}
    </div>
)

const ThreadVisual = () => (
    <div className="flex items-center gap-2 w-full">
        <div className="flex -space-x-2">
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.15 + i * 0.1, type: "spring" }}
                    className="w-7 h-7 rounded-full ring-2 ring-background-elevated bg-brand-primary/20 flex items-center justify-center text-[10px] font-medium text-brand-primary"
                >
                    {["АН", "ИК", "ОР"][i]}
                </motion.div>
            ))}
        </div>
        <motion.div
            initial={{ opacity: 0, x: -6 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="flex-1 h-7 rounded-full bg-background border border-border-subtle px-3 flex items-center"
        >
            <span className="text-[10px] text-foreground-secondary/70">«Сильный кандидат, берём»</span>
        </motion.div>
    </div>
)

const visuals = {
    form: FormVisual,
    kanban: KanbanVisual,
    thread: ThreadVisual,
}

export const HowItWorks = () => (
    <section className="relative py-28 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
                <span className="text-brand-primary uppercase tracking-wide">
                    Как это работает
                </span>
                <h2 className="text-foreground mt-3">
                    От вакансии до найма — три шага
                </h2>
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="hidden md:block absolute top-9 w-full h-px bg-border-subtle" />

                {steps.map((s, i) => {
                    const Visual = visuals[s.visual]
                    return (
                        <motion.div
                            key={s.title}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{ duration: 0.5, delay: i * 0.12 }}
                            className="relative flex flex-col"
                        >
                            <div className="relative z-10 flex items-center gap-2.5 mb-6">
                                <span className="text-foreground">
                                    Шаг {i + 1}
                                </span>
                            </div>

                            <div className="flex-1 rounded-3xl p-6 bg-background-elevated border border-border-subtle shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col gap-5">
                                <div className="rounded-xl bg-background/60 border border-border-subtle/60 p-3 min-h-22 flex items-center">
                                    <Visual />
                                </div>

                                <div>
                                    <h3 className="text-foreground mb-2">{s.title}</h3>
                                    <p className="text-foreground-secondary">{s.desc}</p>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    </section>
)