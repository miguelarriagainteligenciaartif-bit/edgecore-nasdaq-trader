import { useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface EventEditorProps {
  event?: {
    id: string;
    time: string;
    currency: string;
    impact: string;
    event: string;
    forecast: string;
    previous: string;
    actual: string;
  };
  selectedDate: Date;
  onSave: () => void;
  mode: "create" | "edit";
}

export function EventEditor({ event, selectedDate, onSave, mode }: EventEditorProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    event_name: event?.event || "",
    event_time: event?.time?.replace(" AM", "").replace(" PM", "") || "08:30",
    impact: event?.impact || "high",
    forecast: event?.forecast || "",
    previous: event?.previous || "",
    actual: event?.actual || "",
  });

  const handleSubmit = async () => {
    if (!formData.event_name.trim()) {
      toast.error("El nombre del evento es requerido");
      return;
    }

    setLoading(true);
    try {
      const eventDate = format(selectedDate, "yyyy-MM-dd");
      
      if (mode === "create") {
        const { error } = await supabase.from("economic_events").insert({
          event_name: formData.event_name,
          event_date: eventDate,
          event_time: formData.event_time,
          impact: formData.impact,
          currency: "USD",
          forecast: formData.forecast || null,
          previous: formData.previous || null,
          actual: formData.actual || null,
        });

        if (error) throw error;
        toast.success("Evento creado correctamente");
      } else {
        const { error } = await supabase
          .from("economic_events")
          .update({
            event_name: formData.event_name,
            event_time: formData.event_time,
            impact: formData.impact,
            forecast: formData.forecast || null,
            previous: formData.previous || null,
            actual: formData.actual || null,
          })
          .eq("id", event?.id);

        if (error) throw error;
        toast.success("Evento actualizado correctamente");
      }

      setOpen(false);
      onSave();
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error("Error al guardar el evento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Agregar Evento
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Agregar Evento Económico" : "Editar Evento"}
          </DialogTitle>
          <DialogDescription>
            {format(selectedDate, "dd/MM/yyyy")} - Eventos USD
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="event_name">Nombre del Evento *</Label>
            <Input
              id="event_name"
              placeholder="ej: Nonfarm Payrolls"
              value={formData.event_name}
              onChange={(e) =>
                setFormData({ ...formData, event_name: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="event_time">Hora (ET)</Label>
              <Input
                id="event_time"
                type="time"
                value={formData.event_time}
                onChange={(e) =>
                  setFormData({ ...formData, event_time: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="impact">Impacto</Label>
              <Select
                value={formData.impact}
                onValueChange={(value) =>
                  setFormData({ ...formData, impact: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Alto</SelectItem>
                  <SelectItem value="medium">Medio</SelectItem>
                  <SelectItem value="low">Bajo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="forecast">Pronóstico</Label>
              <Input
                id="forecast"
                placeholder="ej: 180K"
                value={formData.forecast}
                onChange={(e) =>
                  setFormData({ ...formData, forecast: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="previous">Anterior</Label>
              <Input
                id="previous"
                placeholder="ej: 150K"
                value={formData.previous}
                onChange={(e) =>
                  setFormData({ ...formData, previous: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="actual">Actual</Label>
              <Input
                id="actual"
                placeholder="ej: 200K"
                value={formData.actual}
                onChange={(e) =>
                  setFormData({ ...formData, actual: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteEventButtonProps {
  eventId: string;
  eventName: string;
  onDelete: () => void;
}

export function DeleteEventButton({ eventId, eventName, onDelete }: DeleteEventButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar "${eventName}"?`)) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("economic_events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;
      toast.success("Evento eliminado");
      onDelete();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Error al eliminar el evento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-destructive hover:text-destructive"
      onClick={handleDelete}
      disabled={loading}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
