interface FunnelStage {
  id: string;
  name: string;
  count: number;
  percentage: number; 
  color: string;      
}

export const funnelStages: FunnelStage[] = [
  {
    id: "1",
    name: "Applications",
    count: 248,
    percentage: 100,
    color: "#22d3ee", 
  },
  {
    id: "2",
    name: "AI screening",
    count: 156,
    percentage: 63,
    color: "#60a5fa", 
  },
  {
    id: "3",
    name: "Committee review",
    count: 72,
    percentage: 30,
    color: "#a78bfa", 
  },
  {
    id: "4",
    name: "Trial lecture",
    count: 28,
    percentage: 15,
    color: "#facc15", 
  },
  {
    id: "5",
    name: "Offer stage",
    count: 9,
    percentage: 8,
    color: "#34d399",
  },
];