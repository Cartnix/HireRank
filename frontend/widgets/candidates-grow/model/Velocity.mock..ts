export interface VelocityDataPoint {
  date: string;
  value: number;
}

export interface VelocityPeriodData {
  total: number;
  delta: string;
  isPositive: boolean;
  chartData: VelocityDataPoint[];
}

export const hiringVelocityMockData: Record<string, VelocityPeriodData> = {};
