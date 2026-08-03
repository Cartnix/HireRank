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
        <section className="relative flex flex-col items-center justify-center w-full min-h-screen bg-background overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-full max-w-200 aspect-square p-2">
                    <div className="absolute inset-x-[4%] inset-y-[4%]">
                        <BrokenCircle
                            size="100%"
                            dash={patterns.outer}
                            rotate={0}
                            duration={60}
                            direction={1}
                            strokeWidth={0.5}
                            style={{ filter: "blur(0.8px)", overflow: "visible" }}
                        />
                    </div>

                    <div className="absolute inset-x-[6%] inset-y-[6%]">
                        <BrokenCircle
                            size="100%" 
                            dash={patterns.middle}
                            rotate={35}
                            duration={45}
                            direction={-1}
                            strokeWidth={0.7}
                            style={{ filter: "blur(0.4px)", overflow: "visible" }}
                        />
                    </div>

                    <div className="absolute inset-x-[8%] inset-y-[8%]">
                        <BrokenCircle
                            size="100%" 
                            dash={patterns.inner}
                            rotate={-20}
                            duration={30}
                            direction={1}
                            strokeWidth={1}
                            style={{ overflow: "visible" }}
                        />
                    </div>

                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center px-6">
                <h1 className="text-h1 font-bold text-foreground">HireAI</h1>
                <p className="mt-4 text-p text-foreground-secondary">
                    Каждый кандидат — на своём месте. Без хаоса в таблицах.
                </p>
            </div>
        </section>
    )
}

const BrokenCircle = ({
    size, dash, rotate,
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