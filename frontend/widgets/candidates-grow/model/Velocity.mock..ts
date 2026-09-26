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

export const hiringVelocityMockData: Record<string, VelocityPeriodData> = {
  "Last 7 days": {
    total: 48,
    delta: "+12.4%",
    isPositive: true,
    chartData: [
      { date: "Sep 20", value: 34 },
      { date: "Sep 21", value: 36 },
      { date: "Sep 22", value: 32 },
      { date: "Sep 23", value: 40 },
      { date: "Sep 24", value: 42 },
      { date: "Sep 25", value: 45 },
      { date: "Sep 26", value: 48 },
    ],
  },
  "Last 30 days": {
    total: 248,
    delta: "+18.2%",
    isPositive: true,
    chartData: [
      { date: "Sep 18", value: 18 },
      { date: "Sep 25", value: 28 },
      { date: "Oct 02", value: 38 },
      { date: "Oct 09", value: 52 },
      { date: "Oct 16", value: 70 },
    ],
  },
  "Last 90 days": {
    total: 620,
    delta: "+24.5%",
    isPositive: true,
    chartData: [
      { date: "Aug", value: 120 },
      { date: "Sep", value: 248 },
      { date: "Oct", value: 620 },
    ],
  },
};