"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface MainButtonI extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  link?: string;
  onClick?: () => void
}

export const MainButton = ({ title, link, onClick, className, ...props }: MainButtonI) => {
  const buttonStyles = "px-5 bg-brand-primary hover:bg-brand-primary-hover text-brand-primary-foreground rounded-2xl";

  const Component = (
    <Button onClick={onClick} className={cn(buttonStyles, className)} {...props}>
      {title}
    </Button>
  );

  return link ? (
    <Link href={link} className={cn(buttonStyles, className)}>
      {title}
    </Link>
  ) : Component;
};