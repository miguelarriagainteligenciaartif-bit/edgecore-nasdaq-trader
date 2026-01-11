import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChecklistData } from "../ChecklistWizard";
import { CheckCircle, Clock } from "lucide-react";

interface StepDailyProps {
  data: ChecklistData;
  updateData: (updates: Partial<ChecklistData>) => void;
}

export const StepDaily = ({ data, updateData }: StepDailyProps) => {
  const allChecked = data.daily_news_reviewed && data.daily_highs_marked && data.daily_lows_marked && data.daily_zones_marked;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Clock className="h-5 w-5 text-primary" />
          <p className="text-sm font-medium text-primary">Revisar cada día - Análisis a las 9:15 AM (NY)</p>
        </div>
      </div>

      {/* Prohibido Dudar */}
      <div className="text-center mb-4">
        <p className="text-lg font-bold text-destructive">PROHIBIDO DUDAR</p>
      </div>

      <div className="space-y-5">
        {/* Checkbox 1: News Calendar */}
        <div className="flex items-start space-x-3 p-4 rounded-lg bg-secondary/30 border border-border">
          <Checkbox
            id="daily-news"
            checked={data.daily_news_reviewed || false}
            onCheckedChange={(checked) => updateData({ daily_news_reviewed: checked === true })}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label htmlFor="daily-news" className="text-base font-medium cursor-pointer">
              Revisar calendario de noticias del día
            </Label>
          </div>
        </div>

        {/* Checkbox 2: Daily Highs */}
        <div className="flex items-start space-x-3 p-4 rounded-lg bg-secondary/30 border border-border">
          <Checkbox
            id="daily-highs"
            checked={data.daily_highs_marked || false}
            onCheckedChange={(checked) => updateData({ daily_highs_marked: checked === true })}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label htmlFor="daily-highs" className="text-base font-medium cursor-pointer">
              Marcar máximos diarios en gráfico
            </Label>
          </div>
        </div>

        {/* Checkbox 3: Daily Lows */}
        <div className="flex items-start space-x-3 p-4 rounded-lg bg-secondary/30 border border-border">
          <Checkbox
            id="daily-lows"
            checked={data.daily_lows_marked || false}
            onCheckedChange={(checked) => updateData({ daily_lows_marked: checked === true })}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label htmlFor="daily-lows" className="text-base font-medium cursor-pointer">
              Marcar mínimos diarios en gráfico
            </Label>
          </div>
        </div>

        {/* Checkbox 4: Zones */}
        <div className="flex items-start space-x-3 p-4 rounded-lg bg-secondary/30 border border-border">
          <Checkbox
            id="daily-zones"
            checked={data.daily_zones_marked || false}
            onCheckedChange={(checked) => updateData({ daily_zones_marked: checked === true })}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label htmlFor="daily-zones" className="text-base font-medium cursor-pointer">
              Marcar zonas de interés: FVG, OB, 50OB
            </Label>
          </div>
        </div>
      </div>

      {/* Success state */}
      {allChecked && (
        <div className="p-4 rounded-lg bg-success/10 border border-success/30">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-success" />
            <div>
              <p className="font-bold text-success">Análisis diario completado</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
