import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { ChecklistData } from "../ChecklistWizard";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface StepEntryDecisionProps {
  data: ChecklistData;
  updateData: (updates: Partial<ChecklistData>) => void;
}

export const StepEntryDecision = ({ data, updateData }: StepEntryDecisionProps) => {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
        <p className="text-sm text-foreground">
          Basándote en todo el análisis realizado (Monthly → Weekly → Daily → 4H → 1H),
          ¿se dan las condiciones para buscar entrada según tus modelos?
        </p>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-medium">
          ¿Se cumplen las condiciones para entrar?
        </Label>
        <RadioGroup
          value={data.entry_conditions_met === null ? "" : data.entry_conditions_met ? "yes" : "no"}
          onValueChange={(value) => {
            updateData({ 
              entry_conditions_met: value === "yes",
              no_trade_reason: value === "yes" ? null : data.no_trade_reason,
              executed_entry: value === "yes" ? data.executed_entry : null,
              entries: value === "yes" ? data.entries : [],
            });
          }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="flex flex-col items-center p-6 rounded-lg border-2 border-border hover:border-success cursor-pointer has-[:checked]:border-success has-[:checked]:bg-success/10 transition-all">
            <RadioGroupItem value="yes" id="conditions-yes" className="sr-only" />
            <Label htmlFor="conditions-yes" className="cursor-pointer flex flex-col items-center gap-3">
              <CheckCircle className="h-12 w-12 text-success" />
              <span className="text-lg font-bold">Sí, buscar entrada</span>
              <span className="text-xs text-muted-foreground text-center">
                Las condiciones están alineadas
              </span>
            </Label>
          </div>
          <div className="flex flex-col items-center p-6 rounded-lg border-2 border-border hover:border-destructive cursor-pointer has-[:checked]:border-destructive has-[:checked]:bg-destructive/10 transition-all">
            <RadioGroupItem value="no" id="conditions-no" className="sr-only" />
            <Label htmlFor="conditions-no" className="cursor-pointer flex flex-col items-center gap-3">
              <XCircle className="h-12 w-12 text-destructive" />
              <span className="text-lg font-bold">No, no operar</span>
              <span className="text-xs text-muted-foreground text-center">
                Las condiciones no son óptimas
              </span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {data.entry_conditions_met === false && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <p className="font-bold text-destructive">PROHIBIDO DUDAR</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Has decidido no operar hoy. Esto es una decisión válida y disciplinada.
              El mercado siempre estará ahí mañana.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">
              ¿Por qué no se dan las condiciones? (opcional)
            </Label>
            <Textarea
              placeholder="Describe brevemente la razón..."
              value={data.no_trade_reason || ""}
              onChange={(e) => updateData({ no_trade_reason: e.target.value })}
              className="resize-none"
              rows={3}
            />
          </div>
        </div>
      )}

      {data.entry_conditions_met === true && (
        <div className="p-4 rounded-lg bg-success/10 border border-success/30">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-success" />
            <div>
              <p className="font-bold text-success">Condiciones OK</p>
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
