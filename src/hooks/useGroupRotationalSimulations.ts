import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GroupRotationalConfig, GroupRotationalState } from "@/utils/groupRotationalSimulator";
import { toast } from "sonner";

export interface SavedGroupSimulation {
  id: string;
  name: string;
  config: GroupRotationalConfig;
  state: GroupRotationalState;
  created_at: string;
  updated_at: string;
}

export const useGroupRotationalSimulations = (userId: string | null) => {
  const [simulations, setSimulations] = useState<SavedGroupSimulation[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSimulations = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("group_rotational_simulations")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      
      // Parse JSONB fields
      const parsed = (data || []).map((sim: any) => ({
        ...sim,
        config: sim.config as GroupRotationalConfig,
        state: sim.state as GroupRotationalState,
      }));
      
      setSimulations(parsed);
    } catch (error: any) {
      console.error("Error loading simulations:", error);
      toast.error("Error al cargar simulaciones");
    } finally {
      setLoading(false);
    }
  };

  const saveSimulation = async (
    name: string,
    config: GroupRotationalConfig,
    state: GroupRotationalState,
    existingId?: string
  ): Promise<string | null> => {
    if (!userId) {
      toast.error("Debes iniciar sesión para guardar");
      return null;
    }

    try {
      // Serialize dates to ISO strings for JSON storage
      const serializedState = {
        ...state,
        trades: state.trades.map(t => ({
          ...t,
          timestamp: t.timestamp instanceof Date ? t.timestamp.toISOString() : t.timestamp,
        })),
        groups: state.groups.map(g => ({
          ...g,
          accounts: g.accounts.map(a => ({
            ...a,
            withdrawals: a.withdrawals.map(w => ({
              ...w,
              date: w.date instanceof Date ? w.date.toISOString() : w.date,
            })),
          })),
        })),
      };

      if (existingId) {
        const { error } = await supabase
          .from("group_rotational_simulations")
          .update({ 
            name, 
            config: config as any, 
            state: serializedState as any 
          })
          .eq("id", existingId);

        if (error) throw error;
        toast.success("Simulación actualizada");
        await loadSimulations();
        return existingId;
      } else {
        const { data, error } = await supabase
          .from("group_rotational_simulations")
          .insert({ 
            user_id: userId, 
            name, 
            config: config as any, 
            state: serializedState as any 
          })
          .select("id")
          .single();

        if (error) throw error;
        toast.success("Simulación guardada");
        await loadSimulations();
        return data.id;
      }
    } catch (error: any) {
      console.error("Error saving simulation:", error);
      toast.error("Error al guardar simulación");
      return null;
    }
  };

  const deleteSimulation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("group_rotational_simulations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Simulación eliminada");
      await loadSimulations();
    } catch (error: any) {
      console.error("Error deleting simulation:", error);
      toast.error("Error al eliminar simulación");
    }
  };

  const loadSimulation = (simulation: SavedGroupSimulation): { 
    config: GroupRotationalConfig; 
    state: GroupRotationalState 
  } => {
    // Deserialize dates from ISO strings
    const deserializedState: GroupRotationalState = {
      ...simulation.state,
      trades: simulation.state.trades.map(t => ({
        ...t,
        timestamp: new Date(t.timestamp),
      })),
      groups: simulation.state.groups.map(g => ({
        ...g,
        accounts: g.accounts.map(a => ({
          ...a,
          withdrawals: a.withdrawals.map(w => ({
            ...w,
            date: new Date(w.date),
          })),
        })),
      })),
    };

    return {
      config: simulation.config,
      state: deserializedState,
    };
  };

  useEffect(() => {
    loadSimulations();
  }, [userId]);

  return {
    simulations,
    loading,
    saveSimulation,
    deleteSimulation,
    loadSimulation,
    refreshSimulations: loadSimulations,
  };
};
