import { ArrowUpRight } from "lucide-react";
import { SectionTitle } from "@/shared/ui/SectionTitle";
import { Card } from "@/shared/ui/Card";
import { ConversionFunnel } from "@/widgets/analytics-charts/ConversionFunnel";
import { SourcesChart } from "@/widgets/analytics-charts/SourcesChart";

export default function AnalyticsPage() {
  return (
    <div>
      <SectionTitle title="Аналитика" subtitle="Эффективность процесса найма" />

      <div className="mb-5 grid grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="text-[12.5px] text-foreground-secondary">Среднее время закрытия</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[28px] font-bold">24</span>
            <span className="text-[13px] text-foreground-secondary">дня</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[12.5px] text-success">
            <ArrowUpRight size={13} className="rotate-90" /> -3 дня к прошлому месяцу
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-[12.5px] text-foreground-secondary">Конверсия «Отклик → Оффер»</div>
          <div className="mt-1 text-[28px] font-bold">13%</div>
          <div className="mt-1.5 text-[12.5px] text-foreground-secondary">6 из 46 кандидатов</div>
        </Card>
        <Card className="p-5">
          <div className="text-[12.5px] text-foreground-secondary">Открытых вакансий</div>
          <div className="mt-1 text-[28px] font-bold">4</div>
          <div className="mt-1.5 text-[12.5px] text-foreground-secondary">из 6 позиций</div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <ConversionFunnel />
        <SourcesChart />
      </div>
    </div>
  );
}
