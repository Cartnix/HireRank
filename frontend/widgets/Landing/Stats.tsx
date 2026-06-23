"use client"

import { motion } from "framer-motion"

const stats = [
    { value: "73%", label: "резюме отсеиваются вручную, теряя сильных кандидатов" },
    { value: "11 дней", label: "в среднем тратится на закрытие одной вакансии в Excel" },
    { value: "1 экран", label: "нужен HireRank, чтобы увидеть весь пайплайн найма" },
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
                    className="glass rounded-3xl p-8 text-center"
                >
                    <div className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
                        {s.value}
                    </div>
                    <p className="mt-3 text-sm text-foreground/60 leading-relaxed">
                        {s.label}
                    </p>
                </motion.div>
            ))}
        </div>
    </section>
)