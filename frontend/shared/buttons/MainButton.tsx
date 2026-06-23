"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface MainButtonI {
  title: string
}

export const MainButton = ({title}: MainButtonI) => {
  return (
    <Button asChild>
      <Link href="/login">{title}</Link>
    </Button>
  );
}