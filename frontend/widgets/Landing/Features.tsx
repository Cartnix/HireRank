"use client"

import { Card } from "@/shared/ui/card"
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
                {features.map((f, i) => (
                    <Card key={f.title} icon={f.icon} title={f.title} desc={f.desc} index={i} />
                ))}
            </div>
        </div>
    </section>
)