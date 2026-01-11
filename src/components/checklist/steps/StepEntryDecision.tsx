import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChecklistData } from "../ChecklistWizard";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface StepEntryDecisionProps {
  data: ChecklistData;
  updateData: (updates: Partial<ChecklistData>) => void;
}

export const StepEntryDecision = ({ data, updateData }: StepEntryDecisionProps) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Clock className="h-5 w-5 text-primary" />
          <p className="text-sm font-medium text-primary">Confirmación a las 9:30 AM (NY)</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Checkbox: All analyses complete */}
        <div className="flex items-start space-x-3 p-4 rounded-lg bg-secondary/30 border border-border">
          <Checkbox
            id="entry-analyses-complete"
            checked={data.entry_conditions_met || false}
            onCheckedChange={(checked) => updateData({ entry_conditions_met: checked === true })}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label htmlFor="entry-analyses-complete" className="text-base font-medium cursor-pointer">
              Todos los análisis multi-timeframe completos
            </Label>
          </div>
        </div>
      </div>

      {/* Warning Note */}
      <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
          <p className="text-sm font-medium">
            Si NO se cumplen las condiciones entre 9:30 - 10:15 AM, NO hay entrada hoy. Esperar hasta mañana.
          </p>
        </div>
      </div>

      {/* Success state */}
      {data.entry_conditions_met && (
        <div className="p-4 rounded-lg bg-success/10 border border-success/30">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-success" />
            <div>
              <p className="font-bold text-success">Listo para ejecutar</p>
              <p className="text-sm text-muted-foreground">
                Continúa al siguiente paso para registrar la ejecución.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
