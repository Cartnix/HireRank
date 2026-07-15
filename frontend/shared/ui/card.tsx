"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface CardProps {
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
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.5, delay: index * 0.08 }}
    className={cn(
      "group relative rounded-3xl p-7 bg-background-elevated border border-border-subtle shadow-sm hover:shadow-md hover:border-brand-primary/30 transition-all duration-300 flex items-center flex-col",
      className
    )}
    {...props}
  >
    {Icon && (
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5 bg-brand-primary/10 group-hover:bg-brand-primary/15 transition-colors duration-300">
        <Icon className="w-5 h-5 text-brand-primary" strokeWidth={1.8} />
      </div>
    )}

    {(title || desc) && (
      <div className="mb-4">
        {title && <h3 className="text-foreground mb-2">{title}</h3>}
        {desc && <p className="text-foreground-secondary">{desc}</p>}
      </div>
    )}

    {children}

    <div className="absolute bottom-0 left-7 right-7 h-px bg-linear-to-r from-transparent via-border to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
  </motion.div>
);