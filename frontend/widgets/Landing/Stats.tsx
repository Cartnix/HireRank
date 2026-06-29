"use client"

import { motion } from "framer-motion"

const stats = [
    { value: "73%", label: "резюме отсеиваются вручную, теряя сильных кандидатов" },
    { value: "11 дней", label: "в среднем тратится на закрытие одной вакансии в Excel" },
    { value: "1 экран", label: "нужен HireAI, чтобы увидеть весь пайплайн найма" },
]

export const Stats = () => (
    <section className="relative py-28 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((s, i) => (
                <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.6, delay: i * 0.12, ease: "easeOut" }}
                    whileHover={{ y: -4 }}
                    className="group relative rounded-3xl p-8 text-center bg-background-elevated border border-border-subtle shadow-sm hover:shadow-md transition-shadow"
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1 w-10 rounded-full bg-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                    <h2 className="tracking-tight text-brand-primary">
                        {s.value}
                    </h2>
                    <p className="mt-3 text-foreground-secondary leading-relaxed">
                        {s.label}
                    </p>
                </motion.div>
            ))}
        </div>
    </section>
)