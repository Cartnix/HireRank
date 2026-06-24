"use client"

import { motion } from "framer-motion"
import { useId } from "react";

const patterns = {
    outer: "12 18 4 18 4 18",
    middle: "8 12 16 12 8 12",
    inner: "20 4 4 4 20 4"
};

export const Hero = () => {

    return (
        <section className="relative flex items-center justify-center w-full min-h-screen bg-background">
            <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <BrokenCircle size="100%" dash={patterns.outer} rotate={0} duration={60} direction={1} strokeWidth={0.5} style={{ filter: "blur(0.8px)" }} />
                <BrokenCircle size="95%" dash={patterns.middle} rotate={35} centered duration={45} direction={-1} strokeWidth={0.7} style={{ filter: "blur(0.4px)" }} />
                <BrokenCircle size="90%" dash={patterns.inner} rotate={-20} centered duration={30} direction={1} strokeWidth={1} />
            </motion.div>

            <motion.div
                className="relative z-10 flex flex-col items-center text-center px-6"
            >
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground">
                    HireAI
                </h1>
                <p className="mt-4 max-w-md text-base md:text-lg font-medium text-foreground-secondary">
                    Каждый кандидат — на своём месте. Без хаоса в таблицах.
                </p>
            </motion.div>
        </section>
    )
}

const BrokenCircle = ({
    size, dash, rotate, centered,
    strokeWidth = 0.8, duration = 20, direction = 1,
    style = {}
}: any) => {
    const id = useId(); 
    const gradientId = `gradient-${id}`;
    
    return (
        <motion.svg
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            overflow="visible"
            className={"absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-primary"}
            style={{ width: size, height: size, ...style }}
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
                cx="50" cy="50" r="42.5"
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth={strokeWidth}
                strokeDasharray={dash}
                strokeLinecap="round"
            />
        </motion.svg>
    )
}