import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ChecklistData } from "../ChecklistWizard";
import { CheckCircle, XCircle, Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StepExecutionLogProps {
  data: ChecklistData;
  updateData: (updates: Partial<ChecklistData>) => void;
}

const ENTRY_MODELS = ["M1", "M3", "Continuación"];

const NO_ENTRY_REASONS = [
  { id: "rr_not_enough", label: "R:R no daba mínimo 1:2" },
  { id: "no_model", label: "No se dio modelo de entrada en la ventana 9:30-10:15 AM" },
];

export const StepExecutionLog = ({ data, updateData }: StepExecutionLogProps) => {
  const addEntry = () => {
    if (data.entries.length >= 3) return;
    const newEntry = {
      entry_number: data.entries.length + 1,
      entry_model: "M1",
      result: null,
    };
    updateData({ entries: [...data.entries, newEntry] });
  };

  const removeEntry = (index: number) => {
    const newEntries = data.entries
      .filter((_, i) => i !== index)
      .map((entry, i) => ({ ...entry, entry_number: i + 1 }));
    updateData({ entries: newEntries });
  };

  const updateEntry = (index: number, field: string, value: string | null) => {
    const newEntries = data.entries.map((entry, i) => {
      if (i === index) {
        return { ...entry, [field]: value };
      }
      return entry;
    });
    updateData({ entries: newEntries });
  };

  const toggleNoEntryReason = (reasonId: string) => {
    const currentReasons = data.no_entry_reasons || [];
    if (currentReasons.includes(reasonId)) {
      updateData({ no_entry_reasons: currentReasons.filter(r => r !== reasonId) });
    } else {
      updateData({ no_entry_reasons: [...currentReasons, reasonId] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Title and subtitle */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-foreground">Paso 8: Registro del Trade</h2>
        <p className="text-muted-foreground">Decisión final y registro</p>
      </div>

      {/* Main question */}
      <div className="space-y-3">
        <Label className="text-base font-medium text-center block">
          ¿Hubo entrada hoy?
        </Label>
        <RadioGroup
          value={data.executed_entry === null ? "" : data.executed_entry ? "yes" : "no"}
          onValueChange={(value) => {
            const executed = value === "yes";
            updateData({ 
              executed_entry: executed,
              entries: executed && data.entries.length === 0 
                ? [{ entry_number: 1, entry_model: "M1", result: null }] 
                : executed ? data.entries : [],
              no_entry_reasons: executed ? [] : data.no_entry_reasons,
              no_entry_notes: executed ? "" : data.no_entry_notes,
            });
          }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="flex flex-col items-center p-6 rounded-lg border-2 border-border hover:border-success cursor-pointer has-[:checked]:border-success has-[:checked]:bg-success/10 transition-all">
            <RadioGroupItem value="yes" id="executed-yes" className="sr-only" />
            <Label htmlFor="executed-yes" className="cursor-pointer flex flex-col items-center gap-3">
              <CheckCircle className="h-12 w-12 text-success" />
              <span className="font-bold text-lg">SÍ - Ejecuté Trade</span>
            </Label>
          </div>
          <div className="flex flex-col items-center p-6 rounded-lg border-2 border-border hover:border-destructive cursor-pointer has-[:checked]:border-destructive has-[:checked]:bg-destructive/10 transition-all">
            <RadioGroupItem value="no" id="executed-no" className="sr-only" />
            <Label htmlFor="executed-no" className="cursor-pointer flex flex-col items-center gap-3">
              <XCircle className="h-12 w-12 text-destructive" />
              <span className="font-bold text-lg">NO - Sin Entrada</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* NO - Sin Entrada: Reasons Panel */}
      {data.executed_entry === false && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground">¿Por qué no ejecutaste?</h3>
            </div>

            <div className="space-y-3">
              {NO_ENTRY_REASONS.map((reason) => (
                <div
                  key={reason.id}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-background border border-border hover:border-primary/50 transition-colors"
                >
                  <Checkbox
                    id={reason.id}
                    checked={(data.no_entry_reasons || []).includes(reason.id)}
                    onCheckedChange={() => toggleNoEntryReason(reason.id)}
                  />
                  <Label htmlFor={reason.id} className="cursor-pointer flex-1">
                    {reason.label}
                  </Label>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Notas Adicionales</Label>
              <Textarea
                placeholder="Escribe cualquier nota adicional sobre por qué no entraste..."
                value={data.no_entry_notes || ""}
                onChange={(e) => updateData({ no_entry_notes: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* SÍ - Ejecuté Trade: Entry Registration Panel */}
      {data.executed_entry === true && (
        <Card className="border-success/30 bg-success/5">
          <CardContent className="p-6 space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-foreground">Registro de Entradas</h3>
              <p className="text-sm text-muted-foreground">¿Cuántas entradas se dieron? (máximo 3)</p>
            </div>

            {/* Entry Count Selection */}
            <div className="flex items-center justify-center gap-4">
              <span className="text-sm text-muted-foreground">Entradas registradas:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-2xl text-primary">{data.entries.length}</span>
                <span className="text-muted-foreground">/ 3</span>
              </div>
              {data.entries.length < 3 && (
                <Button variant="outline" size="sm" onClick={addEntry}>
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir
                </Button>
              )}
            </div>

            {/* Entry Cards */}
            <div className="space-y-4">
              {data.entries.map((entry, index) => (
                <Card key={index} className="bg-background border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-bold text-lg text-primary">
                        Entrada {entry.entry_number}
                      </span>
                      {data.entries.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEntry(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Model Selection */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Modelo de Entrada</Label>
                        <Select
                          value={entry.entry_model}
                          onValueChange={(value) => updateEntry(index, "entry_model", value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ENTRY_MODELS.map((model) => (
                              <SelectItem key={model} value={model}>
                                {model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Result Selection */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Resultado</Label>
                        <RadioGroup
                          value={entry.result || ""}
                          onValueChange={(value) => updateEntry(index, "result", value)}
                          className="grid grid-cols-2 gap-2"
                        >
                          <div className="flex items-center justify-center p-3 rounded-lg border-2 border-border hover:border-success cursor-pointer has-[:checked]:border-success has-[:checked]:bg-success/20 transition-all">
                            <RadioGroupItem value="TP" id={`tp-${index}`} className="sr-only" />
                            <Label htmlFor={`tp-${index}`} className="cursor-pointer flex items-center gap-2">
                              <TrendingUp className="h-5 w-5 text-success" />
                              <span className="font-bold text-success">TP</span>
                            </Label>
                          </div>
                          <div className="flex items-center justify-center p-3 rounded-lg border-2 border-border hover:border-destructive cursor-pointer has-[:checked]:border-destructive has-[:checked]:bg-destructive/20 transition-all">
                            <RadioGroupItem value="SL" id={`sl-${index}`} className="sr-only" />
                            <Label htmlFor={`sl-${index}`} className="cursor-pointer flex items-center gap-2">
                              <TrendingDown className="h-5 w-5 text-destructive" />
                              <span className="font-bold text-destructive">SL</span>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary */}
            {data.entries.length > 0 && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="text-center space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Resumen de Resultados</span>
                  <div className="flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-success" />
                      <span className="font-bold text-success text-xl">
                        {data.entries.filter(e => e.result === "TP").length} TP
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-destructive" />
                      <span className="font-bold text-destructive text-xl">
                        {data.entries.filter(e => e.result === "SL").length} SL
                      </span>
                    </div>
                    {data.entries.filter(e => e.result === null).length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xl">
                          {data.entries.filter(e => e.result === null).length} Pendiente
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
