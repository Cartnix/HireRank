"use client";

import { View } from "@/shared/utils/navigation";
import { Sidebar } from "@/widgets/sidebar/ui/Sidebar";
import { useState } from "react";

export default function SidebarView() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
    null,
  );
  const [view, setView] = useState<View>("dashboard");

  const navigate = (v: View) => {
    setView(v);
    setSelectedJobId(null);
    setSelectedCandidateId(null);
  };

  return <Sidebar/>;
}
