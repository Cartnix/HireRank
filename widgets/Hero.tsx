"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react";

const patterns = {
    outer: "12 18 4 18 4 18",
    middle: "8 12 16 12 8 12", 
    inner: "20 4 4 4 20 4"     
};

export const Hero = () => {
    const containerRef = useRef<HTMLDivElement>(null)

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    })

    const scale = useTransform(scrollYProgress, [0, 1], [1.5, 1])
    const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.3])

    return (
        <div ref={containerRef} className="relative flex items-center justify-center w-98 h-98">
            <motion.div
                className="absolute inset-0"
                style={{ scale, opacity }} 
            >
                <BrokenCircle size="100%" dash={patterns.outer} rotate={0} duration={60} direction={1} strokeWidth={0.5} style={{ filter: "blur(0.8px)" }} />
                <BrokenCircle size="95%" dash={patterns.middle} rotate={35} centered duration={45} direction={-1} strokeWidth={0.7} style={{ filter: "blur(0.4px)" }} />
                <BrokenCircle size="90%" dash={patterns.inner} rotate={-20} centered duration={30} direction={1} strokeWidth={1} />
            </motion.div>

            <motion.div
                className="relative z-10 flex flex-col items-center text-center px-6"
                style={{ opacity: useTransform(scrollYProgress, [0, 0.5], [1, 0]) }}
            >
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground">
                    HireRank
                </h1>
                <p className="mt-4 max-w-md text-base md:text-lg font-medium text-foreground/80">
                    Каждый кандидат — на своём месте. Без хаоса в таблицах.
                </p>
            </motion.div>
        </div>
    )
}

const BrokenCircle = ({
    size, dash, rotate, centered,
    strokeWidth = 0.8, duration = 20, direction = 1,
    style = {} // Добавляем поддержку внешних стилей (для blur)
}: any) => {
    const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <motion.svg
            viewBox="0 0 100 100"
            className={centered ? "absolute inset-0 m-auto" : "absolute inset-0"}
            style={{ width: size, height: size, ...style }} // Применяем blur через style
            animate={{ rotate: [rotate, rotate + 360 * direction] }}
            transition={{ duration, repeat: Infinity, ease: "linear" }}
        >
            <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
                    <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
            </defs>
            <circle
                cx="50" cy="50" r="48"
                fill="none"
                stroke={`url(#${gradientId})`}
                className="stroke-primary"
                strokeWidth={strokeWidth}
                strokeDasharray={dash}
                strokeLinecap="round"
            />
        </motion.svg>
    )
}