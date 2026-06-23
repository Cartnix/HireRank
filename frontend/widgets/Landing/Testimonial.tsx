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
            className="glass rounded-[2.5rem] max-w-3xl mx-auto p-12 text-center"
        >
            <p className="text-2xl md:text-3xl font-medium tracking-tight text-foreground leading-snug">
                «Раньше у нас было пять таблиц и забытые письма кандидатам.
                Теперь весь найм виден за один взгляд.»
            </p>
            <div className="mt-6 text-sm text-foreground/50">
                Анна Соколова — Head of HR, Nimbus Tech
            </div>
        </motion.div>
    </section>
)