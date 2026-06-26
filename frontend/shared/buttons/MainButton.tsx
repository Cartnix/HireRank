"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface MainButtonI {
  title: string,
  link?: string,
}

export const MainButton = ({ title, link }: MainButtonI) => {
  return (
    <Button asChild>
      {link ? <Link href="/login">{title}</Link> : <span>{title}</span>}
    </Button>
  );
}