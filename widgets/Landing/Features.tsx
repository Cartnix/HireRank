"use client"

import { motion } from "framer-motion"
import { Layers, Filter, MessageSquareText, BarChart3 } from "lucide-react"

const features = [
    {
        icon: Layers,
        title: "Канбан по этапам",
        desc: "Перетащил кандидата — статус обновился у всей команды. Без таблиц и копипасты.",
    },
    {
        icon: Filter,
        title: "Умный отбор",
        desc: "Фильтры по навыкам, опыту и зарплатным ожиданиям сужают сотни резюме до десятка.",
    },
    {
        icon: MessageSquareText,
        title: "Заметки команды",
        desc: "Каждый комментарий рекрутера и нанимающего менеджера — в одной карточке кандидата.",
    },
    {
        icon: BarChart3,
        title: "Воронка в реальном времени",
        desc: "Видно, на каком этапе теряются кандидаты, прежде чем это станет проблемой.",
    },
]

export const Features = () => (
    <section className="relative py-28 px-6">
        <div className="max-w-5xl mx-auto">
            <div className="mb-14 text-center">
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                    Всё, что нужно нанимающей команде
                </h2>
                <p className="mt-3 text-foreground/60 max-w-xl mx-auto">
                    Ничего лишнего. Только то, что ускоряет решение «да» или «нет».
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {features.map((f, i) => {
                    const Icon = f.icon
                    return (
                        <motion.div
                            key={f.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{ duration: 0.5, delay: i * 0.08 }}
                            className="glass rounded-3xl p-7 group hover:bg-white/9 transition-colors duration-300"
                        >
                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5"
                                 style={{ background: "var(--accent-soft)" }}>
                                <Icon className="w-5 h-5" style={{ color: "var(--accent)" }} strokeWidth={1.8} />
                            </div>
                            <h3 className="text-lg font-medium text-foreground mb-2">{f.title}</h3>
                            <p className="text-sm text-foreground/60 leading-relaxed">{f.desc}</p>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    </section>
)