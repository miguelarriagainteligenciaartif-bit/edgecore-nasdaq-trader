import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, TrendingUp, TrendingDown } from "lucide-react";

interface ChecklistEntry {
  id?: string;
  entry_number: number;
  entry_model: string;
  result: string | null;
}

interface ChecklistEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checklistId: string;
  date: string;
  entries: ChecklistEntry[];
  onUpdated: () => void;
}

export const ChecklistEditDialog = ({
  open,
  onOpenChange,
  checklistId,
  date,
  entries,
  onUpdated,
}: ChecklistEditDialogProps) => {
  const [editedEntries, setEditedEntries] = useState<ChecklistEntry[]>(entries);
  const [saving, setSaving] = useState(false);

  const updateEntry = (index: number, field: 'entry_model' | 'result', value: string | null) => {
    setEditedEntries(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update each entry
      for (const entry of editedEntries) {
        if (entry.id) {
          const { error } = await supabase
            .from('checklist_entries')
            .update({
              entry_model: entry.entry_model,
              result: entry.result,
            })
            .eq('id', entry.id);

          if (error) throw error;
        }
      }

      toast.success("Entradas actualizadas correctamente");
      onUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating entries:', error);
      toast.error("Error al actualizar las entradas");
    } finally {
      setSaving(false);
    }
  };

  // Reset entries when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setEditedEntries(entries);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Registro - {date}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {editedEntries.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No hay entradas registradas para este día.
            </p>
          ) : (
            <div className="space-y-4">
              {editedEntries.map((entry, index) => (
                <div
                  key={entry.id || index}
                  className="p-4 border border-border rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-semibold">
                      Entrada #{entry.entry_number}
                    </Badge>
                    {entry.result === 'TP' && (
                      <TrendingUp className="h-4 w-4 text-success" />
                    )}
                    {entry.result === 'SL' && (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Modelo</Label>
                      <Select
                        value={entry.entry_model}
                        onValueChange={(value) => updateEntry(index, 'entry_model', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M1">M1</SelectItem>
                          <SelectItem value="M3">M3</SelectItem>
                          <SelectItem value="Continuación">Continuación</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Resultado</Label>
                      <Select
                        value={entry.result || "pending"}
                        onValueChange={(value) => updateEntry(index, 'result', value === "pending" ? null : value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TP">
                            <span className="flex items-center gap-2 text-success">
                              <TrendingUp className="h-3 w-3" /> TP
                            </span>
                          </SelectItem>
                          <SelectItem value="SL">
                            <span className="flex items-center gap-2 text-destructive">
                              <TrendingDown className="h-3 w-3" /> SL
                            </span>
                          </SelectItem>
                          <SelectItem value="pending">
                            <span className="text-muted-foreground">Pendiente</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={saving || editedEntries.length === 0}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
