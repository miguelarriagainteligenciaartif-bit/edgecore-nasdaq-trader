import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";

interface SaveSimulationDialogProps {
  onSave: (name: string) => Promise<void>;
  currentName?: string;
  isUpdate?: boolean;
}

export const SaveSimulationDialog = ({ 
  onSave, 
  currentName = "", 
  isUpdate = false 
}: SaveSimulationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setSaving(true);
    await onSave(name.trim());
    setSaving(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Save className="h-4 w-4 mr-1" />
          {isUpdate ? "Actualizar" : "Guardar"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isUpdate ? "Actualizar simulación" : "Guardar simulación"}
          </DialogTitle>
          <DialogDescription>
            {isUpdate 
              ? "Actualiza el nombre o guarda los cambios actuales."
              : "Dale un nombre a tu simulación para poder continuarla después."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mi simulación rotacional"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? "Guardando..." : (isUpdate ? "Actualizar" : "Guardar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
