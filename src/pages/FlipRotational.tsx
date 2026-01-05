import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { GroupConfigForm } from "@/components/rotational/GroupConfigForm";
import { GroupSimulationDisplay } from "@/components/rotational/GroupSimulationDisplay";
import { GroupSummaryCards } from "@/components/rotational/GroupSummaryCards";
import { GroupTradeHistory } from "@/components/rotational/GroupTradeHistory";
import { WithdrawalProjection } from "@/components/rotational/WithdrawalProjection";
import { SaveSimulationDialog } from "@/components/rotational/SaveSimulationDialog";
import { LoadSimulationDialog } from "@/components/rotational/LoadSimulationDialog";
import { Button } from "@/components/ui/button";
import { 
  GroupRotationalConfig,
  GroupRotationalState,
  BrokerType,
  createDefaultConfig,
  initializeGroupState,
  processGroupTrade,
  undoGroupTrade,
} from "@/utils/groupRotationalSimulator";
import { useGroupRotationalSimulations, SavedGroupSimulation } from "@/hooks/useGroupRotationalSimulations";
import { supabase } from "@/integrations/supabase/client";
import { Layers, Undo2, RotateCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FlipRotational = () => {
  const [user, setUser] = useState<any>(null);
  const [config, setConfig] = useState<GroupRotationalConfig>(createDefaultConfig());
  const [state, setState] = useState<GroupRotationalState | null>(null);
  const [isSimulationActive, setIsSimulationActive] = useState(false);
  const [currentSimulationId, setCurrentSimulationId] = useState<string | null>(null);
  const [currentSimulationName, setCurrentSimulationName] = useState<string>("");

  const { 
    simulations, 
    loading: loadingSimulations, 
    saveSimulation, 
    deleteSimulation, 
    loadSimulation 
  } = useGroupRotationalSimulations(user?.id ?? null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleStartSimulation = () => {
    const initialState = initializeGroupState(config);
    setState(initialState);
    setIsSimulationActive(true);
    setCurrentSimulationId(null);
    setCurrentSimulationName("");
  };

  const handleTradeResult = (brokerType: BrokerType, result: 'TP' | 'SL') => {
    if (!state) return;
    const newState = processGroupTrade(state, brokerType, result);
    setState(newState);
  };

  const handleUndo = () => {
    if (!state) return;
    const newState = undoGroupTrade(state);
    setState(newState);
  };

  const handleReset = () => {
    const initialState = initializeGroupState(config);
    setState(initialState);
  };

  const handleNewSimulation = () => {
    setState(null);
    setIsSimulationActive(false);
    setCurrentSimulationId(null);
    setCurrentSimulationName("");
  };

  const handleSaveSimulation = async (name: string) => {
    if (!state) return;
    const id = await saveSimulation(name, config, state, currentSimulationId || undefined);
    if (id) {
      setCurrentSimulationId(id);
      setCurrentSimulationName(name);
    }
  };

  const handleLoadSimulation = (simulation: SavedGroupSimulation) => {
    const { config: loadedConfig, state: loadedState } = loadSimulation(simulation);
    setConfig(loadedConfig);
    setState(loadedState);
    setIsSimulationActive(true);
    setCurrentSimulationId(simulation.id);
    setCurrentSimulationName(simulation.name);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      <Header userName={user?.email} />

      {/* Title Section */}
      <div className="border-b border-border/50 backdrop-blur-sm bg-card/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="text-foreground">FLIP X5</span>{" "}
                <span className="text-primary">ROTACIONAL</span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Simulador de Grupos de Cuentas con Replicador
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 space-y-6">
        {!isSimulationActive ? (
          <>
            {/* Botones de cargar simulación */}
            <div className="flex justify-end">
              <LoadSimulationDialog
                simulations={simulations}
                loading={loadingSimulations}
                onLoad={handleLoadSimulation}
                onDelete={deleteSimulation}
              />
            </div>
            
            <GroupConfigForm
              config={config}
              onConfigChange={setConfig}
              onStart={handleStartSimulation}
              isSimulationActive={isSimulationActive}
            />
          </>
        ) : (
          <>
            {/* Controles superiores */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  disabled={state?.trades.length === 0}
                >
                  <Undo2 className="h-4 w-4 mr-1" />
                  Deshacer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reiniciar
                </Button>
                <SaveSimulationDialog
                  onSave={handleSaveSimulation}
                  currentName={currentSimulationName}
                  isUpdate={!!currentSimulationId}
                />
                <LoadSimulationDialog
                  simulations={simulations}
                  loading={loadingSimulations}
                  onLoad={handleLoadSimulation}
                  onDelete={deleteSimulation}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewSimulation}
                className="text-muted-foreground"
              >
                ← Nueva simulación
              </Button>
            </div>

            {/* Indicador de simulación guardada */}
            {currentSimulationName && (
              <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md inline-block">
                📁 {currentSimulationName}
              </div>
            )}

            {/* Resumen */}
            <GroupSummaryCards state={state!} />

            {/* Tabs para diferentes vistas */}
            <Tabs defaultValue="simulation" className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="simulation">Simulación</TabsTrigger>
                <TabsTrigger value="projection">Proyección</TabsTrigger>
                <TabsTrigger value="history">Historial</TabsTrigger>
              </TabsList>
              
              <TabsContent value="simulation" className="mt-4">
                <GroupSimulationDisplay
                  state={state!}
                  onTradeResult={handleTradeResult}
                />
              </TabsContent>
              
              <TabsContent value="projection" className="mt-4">
                <WithdrawalProjection state={state!} />
              </TabsContent>
              
              <TabsContent value="history" className="mt-4">
                <GroupTradeHistory trades={state!.trades} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default FlipRotational;
