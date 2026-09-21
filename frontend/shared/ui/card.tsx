"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface CardProps extends Omit<HTMLMotionProps<"section">, "children"> {
  icon?: LucideIcon;
  title?: string;
  desc?: string;
  index?: number;
  className?: string;
  children?: React.ReactNode;
}

export const Card = ({
  icon: Icon,
  title,
  desc,
  index = 0,
  className,
  children,
  ...props
}: CardProps) => (
  <motion.section
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.5, delay: index * 0.08 }}
    className={cn(
      // Карточка использует синхронизированные токены фона, текста и границ
      "group relative rounded-2xl p-6 bg-card text-card-foreground",
      "border border-border shadow-lg shadow-black/5 backdrop-blur-md",
      // Интерактивные состояния при наведении
      "hover:border-brand-primary/40 hover:shadow-xl hover:shadow-brand-primary/5",
      "transition-all duration-300",
      className
    )}
    {...props}
  >
    {Icon && (
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-brand-primary/10 text-brand-primary group-hover:bg-brand-primary/20 group-hover:scale-105 transition-all duration-300">
        <Icon className="w-6 h-6" strokeWidth={1.8} />
      </div>
    )}

    {(title || desc) && (
      <div className="space-y-1.5 mb-4">
        {title && (
          <h3 className="mt-0! mb-0! text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h3>
        )}
        {desc && (
          <p className="mb-0! text-sm text-foreground-secondary leading-relaxed">
            {desc}
          </p>
        )}
      </div>
    )}

    {children}

    <div className="absolute bottom-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-brand-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
  </motion.section>
);