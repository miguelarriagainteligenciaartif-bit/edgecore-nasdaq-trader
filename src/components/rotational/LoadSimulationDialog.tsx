import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FolderOpen, Trash2, Calendar, TrendingUp, Loader2 } from "lucide-react";
import { SavedGroupSimulation } from "@/hooks/useGroupRotationalSimulations";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface LoadSimulationDialogProps {
  simulations: SavedGroupSimulation[];
  loading: boolean;
  onLoad: (simulation: SavedGroupSimulation) => void;
  onDelete: (id: string) => void;
}

export const LoadSimulationDialog = ({
  simulations,
  loading,
  onLoad,
  onDelete,
}: LoadSimulationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleLoad = (simulation: SavedGroupSimulation) => {
    onLoad(simulation);
    setOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <FolderOpen className="h-4 w-4 mr-1" />
            Cargar
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Simulaciones guardadas</DialogTitle>
            <DialogDescription>
              Selecciona una simulación para continuar donde la dejaste.
            </DialogDescription>
          </DialogHeader>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : simulations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tienes simulaciones guardadas.
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {simulations.map((sim) => (
                  <div
                    key={sim.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{sim.name}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(sim.updated_at), "d MMM yyyy, HH:mm", { locale: es })}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {sim.state.trades.length} trades
                          </span>
                        </div>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {sim.state.groups.map((g) => (
                            <span
                              key={g.id}
                              className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                            >
                              {g.name} ({g.accounts.length} cuentas)
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleLoad(sim)}
                        >
                          Cargar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(sim.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar simulación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La simulación se eliminará permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
