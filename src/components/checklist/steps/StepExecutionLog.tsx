import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChecklistData } from "../ChecklistWizard";
import { CheckCircle, XCircle, Plus, Trash2 } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-base font-medium">
          ¿Ejecutaste entrada?
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
            });
          }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="flex flex-col items-center p-4 rounded-lg border-2 border-border hover:border-success cursor-pointer has-[:checked]:border-success has-[:checked]:bg-success/10 transition-all">
            <RadioGroupItem value="yes" id="executed-yes" className="sr-only" />
            <Label htmlFor="executed-yes" className="cursor-pointer flex flex-col items-center gap-2">
              <CheckCircle className="h-10 w-10 text-success" />
              <span className="font-bold">Sí</span>
            </Label>
          </div>
          <div className="flex flex-col items-center p-4 rounded-lg border-2 border-border hover:border-destructive cursor-pointer has-[:checked]:border-destructive has-[:checked]:bg-destructive/10 transition-all">
            <RadioGroupItem value="no" id="executed-no" className="sr-only" />
            <Label htmlFor="executed-no" className="cursor-pointer flex flex-col items-center gap-2">
              <XCircle className="h-10 w-10 text-destructive" />
              <span className="font-bold">No</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {data.executed_entry === true && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">
              Registro de Entradas ({data.entries.length}/3)
            </Label>
            {data.entries.length < 3 && (
              <Button variant="outline" size="sm" onClick={addEntry}>
                <Plus className="h-4 w-4 mr-2" />
                Añadir Entrada
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {data.entries.map((entry, index) => (
              <Card key={index} className="bg-secondary/30 border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-primary">
                      Entrada {entry.entry_number}
                    </span>
                    {data.entries.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEntry(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Modelo</Label>
                      <Select
                        value={entry.entry_model}
                        onValueChange={(value) => updateEntry(index, "entry_model", value)}
                      >
                        <SelectTrigger>
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

                    <div className="space-y-2">
                      <Label className="text-sm">Resultado</Label>
                      <Select
                        value={entry.result || "pending"}
                        onValueChange={(value) => updateEntry(index, "result", value === "pending" ? null : value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">
                            <span className="text-muted-foreground">Pendiente</span>
                          </SelectItem>
                          <SelectItem value="TP">
                            <span className="text-success font-bold">TP ✓</span>
                          </SelectItem>
                          <SelectItem value="SL">
                            <span className="text-destructive font-bold">SL ✗</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {data.entries.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Resumen:</span>
                <div className="flex gap-4">
                  <span className="text-success">
                    TP: {data.entries.filter(e => e.result === "TP").length}
                  </span>
                  <span className="text-destructive">
                    SL: {data.entries.filter(e => e.result === "SL").length}
                  </span>
                  <span className="text-muted-foreground">
                    Pendiente: {data.entries.filter(e => e.result === null).length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {data.executed_entry === false && (
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground">
            No ejecutaste entrada a pesar de que las condiciones estaban alineadas.
            Esto puede ser una decisión prudente si surgieron factores adicionales.
          </p>
        </div>
      )}
    </div>
  );
};
