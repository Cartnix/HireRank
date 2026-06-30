"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sun, Moon } from "lucide-react"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    if (!mounted) {
        return <div className="h-12 w-12 rounded-full bg-background-elevated border border-border" />
    }

    const isDark = theme === "dark"

    return (
        <motion.button
            aria-label="Сменить тему"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            whileTap={{ scale: 0.88 }}
            className="absolute bottom-5 right-5 h-12 w-12 rounded-full flex items-center justify-center overflow-hidden border"
            style={{
                background: isDark
                    ? "linear-gradient(145deg, #2c2c2e, #1c1c1e)"
                    : "linear-gradient(145deg, #ffffff, #f2f2f7)",
                borderColor: "var(--border)",
                boxShadow: isDark
                    ? "0 0 0 1px rgba(10,132,255,0.15), 0 4px 14px rgba(10,132,255,0.25), 0 1px 2px rgba(0,0,0,0.4)"
                    : "0 0 0 1px rgba(0,122,255,0.08), 0 4px 14px rgba(0,122,255,0.18), 0 1px 2px rgba(0,0,0,0.06)",
            }}
        >
            <motion.span
                key={isDark ? "glow-dark" : "glow-light"}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="absolute h-7 w-7 rounded-full blur-md"
                style={{
                    background: isDark
                        ? "var(--brand-primary)"
                        : "var(--warning)",
                    opacity: 0.35,
                }}
            />

            <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                    <motion.span
                        key="moon"
                        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                        animate={{ rotate: 0, opacity: 1, scale: 1 }}
                        exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="relative z-10 flex items-center justify-center"
                    >
                        <Moon className="h-5 w-5" style={{ color: "var(--brand-primary)" }} fill="var(--brand-primary)" strokeWidth={0} />
                    </motion.span>
                ) : (
                    <motion.span
                        key="sun"
                        initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                        animate={{ rotate: 0, opacity: 1, scale: 1 }}
                        exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="relative z-10 flex items-center justify-center"
                    >
                        <Sun className="h-5 w-5" style={{ color: "var(--warning)" }} strokeWidth={2.2} />
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.button>
    )
}