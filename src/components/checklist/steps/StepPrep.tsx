import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChecklistData } from "../ChecklistWizard";
import { CheckCircle, Sparkles } from "lucide-react";

interface StepPrepProps {
  data: ChecklistData;
  updateData: (updates: Partial<ChecklistData>) => void;
}

export const StepPrep = ({ data, updateData }: StepPrepProps) => {
  const allChecked = data.prep_workspace_clean && data.prep_aromatherapy && data.prep_best_trader;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-primary mb-2">El poder de la espera</h2>
        <p className="text-muted-foreground">Preparación mental antes de operar</p>
      </div>

      <div className="space-y-5">
        {/* Checkbox 1: Workspace */}
        <div className="flex items-start space-x-3 p-4 rounded-lg bg-secondary/30 border border-border">
          <Checkbox
            id="prep-workspace"
            checked={data.prep_workspace_clean || false}
            onCheckedChange={(checked) => updateData({ prep_workspace_clean: checked === true })}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label htmlFor="prep-workspace" className="text-base font-medium cursor-pointer">
              Limpiar y ordenar el espacio de trabajo
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              <Sparkles className="h-3 w-3 inline mr-1" />
              Una acción sencilla incrementa un 94% la probabilidad de éxito en la ejecución
            </p>
          </div>
        </div>

        {/* Checkbox 2: Aromatherapy */}
        <div className="flex items-start space-x-3 p-4 rounded-lg bg-secondary/30 border border-border">
          <Checkbox
            id="prep-aromatherapy"
            checked={data.prep_aromatherapy || false}
            onCheckedChange={(checked) => updateData({ prep_aromatherapy: checked === true })}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label htmlFor="prep-aromatherapy" className="text-base font-medium cursor-pointer">
              Activar aromaterapia (difusor o incienso)
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              <Sparkles className="h-3 w-3 inline mr-1" />
              Científicamente comprobado que mejora el enfoque durante la sesión
            </p>
          </div>
        </div>

        {/* Checkbox 3: Best Trader */}
        <div className="flex items-start space-x-3 p-4 rounded-lg bg-secondary/30 border border-border">
          <Checkbox
            id="prep-best-trader"
            checked={data.prep_best_trader || false}
            onCheckedChange={(checked) => updateData({ prep_best_trader: checked === true })}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label htmlFor="prep-best-trader" className="text-base font-medium cursor-pointer">
              Ser el mejor trader ejecutando nuestro sistema
            </Label>
          </div>
        </div>
      </div>

      {allChecked && (
        <div className="p-4 rounded-lg bg-success/10 border border-success/30">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-success" />
            <div>
              <p className="font-bold text-success">Preparación completada</p>
              <p className="text-sm text-muted-foreground">
                Estás listo para continuar con el análisis.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
