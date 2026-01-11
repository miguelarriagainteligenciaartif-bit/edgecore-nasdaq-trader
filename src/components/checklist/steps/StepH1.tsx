import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChecklistData } from "../ChecklistWizard";
import { CheckCircle, Clock } from "lucide-react";

interface StepH1Props {
  data: ChecklistData;
  updateData: (updates: Partial<ChecklistData>) => void;
}

export const StepH1 = ({ data, updateData }: StepH1Props) => {
  const allChecked = data.h1_confluences_verified && data.h1_zones_identified && data.h1_direction_determined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Clock className="h-5 w-5 text-primary" />
          <p className="text-sm font-medium text-primary">Análisis entre 9:27 - 9:29 AM (NY)</p>
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
            id="h1-confluences"
            checked={data.h1_confluences_verified || false}
            onCheckedChange={(checked) => updateData({ h1_confluences_verified: checked === true })}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label htmlFor="h1-confluences" className="text-base font-medium cursor-pointer">
              Verificar confluencias con zonas de diario y H4
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              ¿Las zonas marcadas en diario y H4 coinciden?
            </p>
          </div>
        </div>

        {/* Checkbox 2: H1 Zones */}
        <div className="flex items-start space-x-3 p-4 rounded-lg bg-secondary/30 border border-border">
          <Checkbox
            id="h1-zones"
            checked={data.h1_zones_identified || false}
            onCheckedChange={(checked) => updateData({ h1_zones_identified: checked === true })}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label htmlFor="h1-zones" className="text-base font-medium cursor-pointer">
              Identificar zonas de 1H cercanas al precio actual
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              ¿Qué zonas de interés hay cerca del precio ahora?
            </p>
          </div>
        </div>

        {/* Checkbox 3: Direction */}
        <div className="flex items-start space-x-3 p-4 rounded-lg bg-secondary/30 border border-border">
          <Checkbox
            id="h1-direction"
            checked={data.h1_direction_determined || false}
            onCheckedChange={(checked) => updateData({ h1_direction_determined: checked === true })}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label htmlFor="h1-direction" className="text-base font-medium cursor-pointer">
              Determinar la dirección del precio con la vela de H1 entre las 9:27 y 9:29 hora New York
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Observar si tiene más mecha por la parte de arriba o por la parte de abajo
            </p>
          </div>
        </div>
      </div>

      {/* Success state */}
      {allChecked && (
        <div className="p-4 rounded-lg bg-success/10 border border-success/30">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-success" />
            <div>
              <p className="font-bold text-success">Análisis 1H completado</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
