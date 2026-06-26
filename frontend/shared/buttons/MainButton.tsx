"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ButtonHTMLAttributes } from "react";

interface MainButtonI extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string,
  link?: string,
}

export const MainButton = ({ title, link, ...props }: MainButtonI) => {
  if (link) {
    return (
      <Button asChild {...props}>
        <Link href={link}>{title}</Link>
      </Button>
    );
  }

  return (
    <Button {...props}>
      {title}
    </Button>
  );
}