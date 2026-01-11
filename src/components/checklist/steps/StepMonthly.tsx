import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChecklistData } from "../ChecklistWizard";
import { Quote, AlertTriangle, CheckCircle, Calendar } from "lucide-react";

interface StepMonthlyProps {
  data: ChecklistData;
  updateData: (updates: Partial<ChecklistData>) => void;
}

export const StepMonthly = ({ data, updateData }: StepMonthlyProps) => {
  const allChecked = data.monthly_highs_marked && data.monthly_lows_marked;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Calendar className="h-5 w-5 text-primary" />
          <p className="text-sm font-medium text-primary">Revisar solo una vez al mes, al inicio</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Este análisis se hace SOLO el primer día del mes. Ignora el resto del mes.
        </p>
      </div>

      <div className="space-y-5">
        {/* Checkbox 1: Monthly Highs */}
        <div className="flex items-start space-x-3 p-4 rounded-lg bg-secondary/30 border border-border">
          <Checkbox
            id="monthly-highs"
            checked={data.monthly_highs_marked || false}
            onCheckedChange={(checked) => updateData({ monthly_highs_marked: checked === true })}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label htmlFor="monthly-highs" className="text-base font-medium cursor-pointer">
              Marcar máximos mensuales
            </Label>
          </div>
        </div>

        {/* Checkbox 2: Monthly Lows */}
        <div className="flex items-start space-x-3 p-4 rounded-lg bg-secondary/30 border border-border">
          <Checkbox
            id="monthly-lows"
            checked={data.monthly_lows_marked || false}
            onCheckedChange={(checked) => updateData({ monthly_lows_marked: checked === true })}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label htmlFor="monthly-lows" className="text-base font-medium cursor-pointer">
              Marcar mínimos mensuales
            </Label>
          </div>
        </div>
      </div>

      {/* Important Note */}
      <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <p className="text-sm font-medium">
            IMPORTANTE: En temporalidad mensual NO se marcan zonas.
          </p>
        </div>
      </div>

      {/* Success state */}
      {allChecked && (
        <div className="p-4 rounded-lg bg-success/10 border border-success/30">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-success" />
            <div>
              <p className="font-bold text-success">Análisis mensual completado</p>
            </div>
          </div>
        </div>
      )}

      {/* Bible Quote */}
      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
        <Quote className="h-5 w-5 mx-auto mb-2 text-primary/60" />
        <p className="text-sm italic text-muted-foreground leading-relaxed">
          "Y el Señor estaba con José, y fue varón próspero."
        </p>
        <p className="text-xs text-primary mt-2 font-medium">— Génesis 39:23</p>
      </div>
    </div>
  );
};
