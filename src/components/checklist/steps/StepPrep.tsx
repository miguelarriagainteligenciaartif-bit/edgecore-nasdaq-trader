import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChecklistData } from "../ChecklistWizard";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface StepPrepProps {
  data: ChecklistData;
  updateData: (updates: Partial<ChecklistData>) => void;
}

export const StepPrep = ({ data, updateData }: StepPrepProps) => {
  const showWarning = data.prep_schedule_clear === false || data.prep_30min_available === false;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-3">
          <Label className="text-base font-medium">
            ¿Tienes la agenda libre durante la sesión americana?
          </Label>
          <RadioGroup
            value={data.prep_schedule_clear === null ? "" : data.prep_schedule_clear ? "yes" : "no"}
            onValueChange={(value) => updateData({ prep_schedule_clear: value === "yes" })}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="schedule-yes" />
              <Label htmlFor="schedule-yes" className="cursor-pointer">Sí</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="schedule-no" />
              <Label htmlFor="schedule-no" className="cursor-pointer">No</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-medium">
            ¿Dispones de al menos 30 minutos para el análisis?
          </Label>
          <RadioGroup
            value={data.prep_30min_available === null ? "" : data.prep_30min_available ? "yes" : "no"}
            onValueChange={(value) => updateData({ prep_30min_available: value === "yes" })}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="time-yes" />
              <Label htmlFor="time-yes" className="cursor-pointer">Sí</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="time-no" />
              <Label htmlFor="time-no" className="cursor-pointer">No</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {showWarning && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div>
              <p className="font-bold text-destructive">PROHIBIDO OPERAR</p>
              <p className="text-sm text-muted-foreground">
                Las condiciones de preparación no están cumplidas. No continúes con el análisis.
              </p>
            </div>
          </div>
        </div>
      )}

      {data.prep_schedule_clear === true && data.prep_30min_available === true && (
        <div className="p-4 rounded-lg bg-success/10 border border-success/30">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-success" />
            <div>
              <p className="font-bold text-success">Preparación OK</p>
              <p className="text-sm text-muted-foreground">
                Puedes continuar con el análisis.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
