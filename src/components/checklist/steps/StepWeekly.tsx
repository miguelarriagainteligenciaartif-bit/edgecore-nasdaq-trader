import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChecklistData } from "../ChecklistWizard";
import { AlertTriangle, CheckCircle, Calendar } from "lucide-react";

interface StepWeeklyProps {
  data: ChecklistData;
  updateData: (updates: Partial<ChecklistData>) => void;
}

export const StepWeekly = ({ data, updateData }: StepWeeklyProps) => {
  const allChecked = data.weekly_news_reviewed && data.weekly_highs_marked && data.weekly_lows_marked;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Calendar className="h-5 w-5 text-primary" />
          <p className="text-sm font-medium text-primary">Revisar cada lunes</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Este análisis se hace SOLO los lunes al inicio de la semana.
        </p>
      </div>

      <div className="space-y-5">
        {/* Checkbox 1: News Calendar */}
        <div className="flex items-start space-x-3 p-4 rounded-lg bg-secondary/30 border border-border">
          <Checkbox
            id="weekly-news"
            checked={data.weekly_news_reviewed || false}
            onCheckedChange={(checked) => updateData({ weekly_news_reviewed: checked === true })}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label htmlFor="weekly-news" className="text-base font-medium cursor-pointer">
              Revisar calendario de noticias económicas de la semana
            </Label>
          </div>
        </div>

        {/* Checkbox 2: Weekly Highs */}
        <div className="flex items-start space-x-3 p-4 rounded-lg bg-secondary/30 border border-border">
          <Checkbox
            id="weekly-highs"
            checked={data.weekly_highs_marked || false}
            onCheckedChange={(checked) => updateData({ weekly_highs_marked: checked === true })}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label htmlFor="weekly-highs" className="text-base font-medium cursor-pointer">
              Marcar máximos semanales
            </Label>
          </div>
        </div>

        {/* Checkbox 3: Weekly Lows */}
        <div className="flex items-start space-x-3 p-4 rounded-lg bg-secondary/30 border border-border">
          <Checkbox
            id="weekly-lows"
            checked={data.weekly_lows_marked || false}
            onCheckedChange={(checked) => updateData({ weekly_lows_marked: checked === true })}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label htmlFor="weekly-lows" className="text-base font-medium cursor-pointer">
              Marcar mínimos semanales
            </Label>
          </div>
        </div>
      </div>

      {/* Important Note */}
      <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <p className="text-sm font-medium">
            IMPORTANTE: En temporalidad Semanal tampoco se marcan zonas.
          </p>
        </div>
      </div>

      {/* Success state */}
      {allChecked && (
        <div className="p-4 rounded-lg bg-success/10 border border-success/30">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-success" />
            <div>
              <p className="font-bold text-success">Análisis semanal completado</p>
            </div>
          </div>
        </div>
      )}

      {/* Prohibido Dudar */}
      <div className="text-center">
        <p className="text-lg font-bold text-destructive">PROHIBIDO DUDAR</p>
      </div>
    </div>
  );
};
