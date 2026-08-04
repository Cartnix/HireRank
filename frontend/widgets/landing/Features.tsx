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
                <h2 className="tracking-tight text-foreground">
                    Всё, что нужно нанимающей команде
                </h2>
                <p className="mt-3 text-foreground-secondary mx-auto">
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
                            whileHover={{ y: -3 }}
                            className="group relative rounded-3xl p-7 bg-background-elevated border border-border-subtle shadow-sm hover:shadow-md hover:border-brand-primary/30 transition-all duration-300"
                        >
                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5 bg-brand-primary/10 group-hover:bg-brand-primary/15 transition-colors duration-300">
                                <Icon className="w-5 h-5 text-brand-primary" strokeWidth={1.8} />
                            </div>
                            <h3 className="text-foreground mb-2">{f.title}</h3>
                            <p className="text-foreground-secondary">{f.desc}</p>

                            <div className="absolute bottom-0 left-7 right-7 h-px bg-linear-to-r from-transparent via-border to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </motion.div>
                    )
                })}
            </div>
        </div>
    </section>
)