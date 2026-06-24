// components/Testimonial.tsx
"use client"

import { motion } from "framer-motion"

export const Testimonial = () => (
    <section className="relative py-28 px-6">
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="relative rounded-[2.5rem] max-w-3xl mx-auto p-12 text-center bg-background-elevated border border-border-subtle shadow-sm"
        >
            <span className="absolute top-8 left-10 text-6xl font-serif text-brand-primary/15 leading-none select-none">
                “
            </span>

            <p className="relative text-2xl md:text-3xl font-medium tracking-tight text-foreground leading-snug">
                Раньше у нас было пять таблиц и забытые письма кандидатам.
                Теперь весь найм виден за один взгляд.
            </p>

            <div className="mt-7 flex items-center justify-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary text-sm font-semibold flex items-center justify-center">
                    АС
                </div>
                <div className="text-sm text-foreground-secondary text-left">
                    <div className="font-medium text-foreground">Анна Соколова</div>
                    <div>Head of HR, Nimbus Tech</div>
                </div>
            </div>
        </motion.div>
    </section>
)