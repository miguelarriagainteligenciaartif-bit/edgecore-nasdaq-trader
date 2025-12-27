import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { RotationalConfigForm } from "@/components/rotational/RotationalConfigForm";
import { RotationalAccountsDisplay } from "@/components/rotational/RotationalAccountsDisplay";
import { RotationalTradeInput } from "@/components/rotational/RotationalTradeInput";
import { RotationalTradeHistory } from "@/components/rotational/RotationalTradeHistory";
import { RotationalSummary } from "@/components/rotational/RotationalSummary";
import { TradeSelector } from "@/components/rotational/TradeSelector";
import {
  RotationalConfig,
  RotationalState,
  RotationalTradeResult,
  initializeRotationalState,
  processTrade,
  processMultipleTrades,
  undoLastTrade,
} from "@/utils/rotationalSimulator";
import { supabase } from "@/integrations/supabase/client";
import { Layers } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FlipRotational = () => {
  const [user, setUser] = useState<any>(null);
  const [config, setConfig] = useState<RotationalConfig>({
    numberOfAccounts: 4,
    initialBalances: [50000, 50000, 50000, 50000],
    riskPerTrade: 2500,
    riskRewardRatio: 2,
  });
  const [state, setState] = useState<RotationalState | null>(null);
  const [isSimulationActive, setIsSimulationActive] = useState(false);
  const [simulationMode, setSimulationMode] = useState<"manual" | "real">("manual");

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
    const initialState = initializeRotationalState(config);
    setState(initialState);
    setIsSimulationActive(true);
    setSimulationMode("manual");
  };

  const handleStartWithRealTrades = (results: RotationalTradeResult[]) => {
    const initialState = initializeRotationalState(config);
    const finalState = processMultipleTrades(initialState, results, config.riskPerTrade, config.riskRewardRatio);
    setState(finalState);
    setIsSimulationActive(true);
    setSimulationMode("real");
  };

  const handleTradeResult = (result: "TP" | "SL") => {
    if (!state) return;
    const newState = processTrade(state, result, config.riskPerTrade, config.riskRewardRatio);
    setState(newState);
  };

  const handleUndo = () => {
    if (!state) return;
    const newState = undoLastTrade(state);
    setState(newState);
  };

  const handleReset = () => {
    const initialState = initializeRotationalState(config);
    setState(initialState);
  };

  const handleNewSimulation = () => {
    setState(null);
    setIsSimulationActive(false);
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
                Simulador de Estrategia Rotacional Flexible
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 space-y-6">
        {!isSimulationActive ? (
          <>
            <RotationalConfigForm
              config={config}
              onConfigChange={setConfig}
              onStart={handleStartSimulation}
              isSimulationActive={isSimulationActive}
            />

            <Tabs defaultValue="real" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="real">Usar Trades Reales</TabsTrigger>
                <TabsTrigger value="manual">Simulación Manual</TabsTrigger>
              </TabsList>
              <TabsContent value="real" className="mt-4">
                <TradeSelector
                  onTradesSelected={handleStartWithRealTrades}
                  isSimulationActive={isSimulationActive}
                />
              </TabsContent>
              <TabsContent value="manual" className="mt-4">
                <div className="text-center py-12 border border-dashed border-border/50 rounded-lg bg-card/30">
                  <div className="text-muted-foreground space-y-2">
                    <p className="text-lg">
                      👆 Configura los parámetros y haz clic en "Iniciar Simulación"
                    </p>
                    <p className="text-sm">
                      Ingresarás manualmente cada resultado (TP/SL)
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <>
            <div className="flex justify-end">
              <button
                onClick={handleNewSimulation}
                className="text-sm text-muted-foreground hover:text-primary transition-colors underline"
              >
                ← Nueva simulación
              </button>
            </div>

            <RotationalSummary
              state={state!}
              initialBalances={config.initialBalances}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RotationalTradeInput
                state={state!}
                onTradeResult={handleTradeResult}
                onUndo={handleUndo}
                onReset={handleReset}
              />
              <RotationalAccountsDisplay
                state={state!}
                initialBalances={config.initialBalances}
              />
            </div>

            <RotationalTradeHistory trades={state!.trades} />
          </>
        )}
      </div>
    </div>
  );
};

export default FlipRotational;
