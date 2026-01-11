import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChecklistData } from "../ChecklistWizard";
import { CheckCircle, Layers } from "lucide-react";

interface StepH4Props {
  data: ChecklistData;
  updateData: (updates: Partial<ChecklistData>) => void;
}

export const StepH4 = ({ data, updateData }: StepH4Props) => {
  const allChecked = data.h4_confluences_verified && data.h4_zones_marked;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Layers className="h-5 w-5 text-primary" />
          <p className="text-sm font-medium text-primary">Refinamiento del análisis</p>
        </div>
      </div>

      {/* Prohibido Dudar */}
      <div className="text-center mb-4">
        <p className="text-lg font-bold text-destructive">PROHIBIDO DUDAR</p>
      </div>

      <div className="space-y-5">
        {/* Checkbox 1: Confluences */}
        <div className="flex items-start space-x-3 p-4 rounded-lg bg-secondary/30 border border-border">
          <Checkbox
            id="h4-confluences"
            checked={data.h4_confluences_verified || false}
            onCheckedChange={(checked) => updateData({ h4_confluences_verified: checked === true })}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label htmlFor="h4-confluences" className="text-base font-medium cursor-pointer">
              Verificar confluencias con zonas diarias
            </Label>
          </div>
        </div>

        {/* Checkbox 2: H4 Zones */}
        <div className="flex items-start space-x-3 p-4 rounded-lg bg-secondary/30 border border-border">
          <Checkbox
            id="h4-zones"
            checked={data.h4_zones_marked || false}
            onCheckedChange={(checked) => updateData({ h4_zones_marked: checked === true })}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label htmlFor="h4-zones" className="text-base font-medium cursor-pointer">
              Marcar zonas de interés 4H: FVG, OB, 50OB
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
              <p className="font-bold text-success">Análisis 4H completado</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
