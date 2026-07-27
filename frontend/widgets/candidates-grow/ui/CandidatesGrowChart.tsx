import { Card, Title, LineChart } from "@tremor/react";

export default function CandidateChart() {
  return (
    <Card>
      <Title>Динамика притока кандидатов</Title>
      <LineChart
        className="mt-6"
        data={chartdata}
        index="month"
        categories={["Кандидаты", "Посещаемость"]}
        colors={["blue", "emerald"]}
        yAxisWidth={40}
      />
    </Card>
  );
}