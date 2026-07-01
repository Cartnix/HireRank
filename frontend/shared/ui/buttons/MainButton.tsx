"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface MainButtonI extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  link?: string;
}

export const MainButton = ({ title, link, className, ...props }: MainButtonI) => {
  const buttonStyles = "px-5 bg-brand-primary hover:bg-brand-primary-hover text-brand-primary-foreground rounded-2xl";

  if (link) {
    return (
      <Button asChild className={cn(buttonStyles, className)} {...props}>
        <Link href={link}>{title}</Link>
      </Button>
    );
  }

  return (
    <Button className={cn(buttonStyles, className)} {...props}>
      {title}
    </Button>
  );
};