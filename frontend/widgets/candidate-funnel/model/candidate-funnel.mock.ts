export interface FunnelStage {
  id: string;
  name: string;
  count: number;
  percentage: number;
  colorClass: string;
}

export const funnelStages: FunnelStage[] = [];
