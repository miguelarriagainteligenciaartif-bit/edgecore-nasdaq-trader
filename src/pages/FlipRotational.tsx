import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { GroupConfigForm } from "@/components/rotational/GroupConfigForm";
import { GroupSimulationDisplay } from "@/components/rotational/GroupSimulationDisplay";
import { GroupSummaryCards } from "@/components/rotational/GroupSummaryCards";
import { GroupTradeHistory } from "@/components/rotational/GroupTradeHistory";
import { WithdrawalProjection } from "@/components/rotational/WithdrawalProjection";
import { SaveSimulationDialog } from "@/components/rotational/SaveSimulationDialog";
import { LoadSimulationDialog } from "@/components/rotational/LoadSimulationDialog";
import { GroupTradeSelector, TradeResult } from "@/components/rotational/GroupTradeSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { 
  Layers, 
  Undo2, 
  RotateCcw, 
  Settings, 
  Play, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Target
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FlipRotational = () => {
  const [user, setUser] = useState<any>(null);
  const [config, setConfig] = useState<GroupRotationalConfig>(createDefaultConfig());
  const [state, setState] = useState<GroupRotationalState | null>(null);
  const [isSimulationActive, setIsSimulationActive] = useState(false);
  const [currentSimulationId, setCurrentSimulationId] = useState<string | null>(null);
  const [currentSimulationName, setCurrentSimulationName] = useState<string>("");
  const [mainTab, setMainTab] = useState<string>("config");

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
    setMainTab("simulation");
  };

  const handleTradeResult = (brokerType: BrokerType, result: 'TP' | 'SL') => {
    if (!state) return;
    const newState = processGroupTrade(state, brokerType, result);
    setState(newState);
  };

  // Process multiple trades from selector
  const handleBatchTrades = (trades: TradeResult[]) => {
    if (!state) return;
    
    let currentState = state;
    const brokerTypes = [...new Set(config.groups.map(g => g.brokerType))];
    
    trades.forEach((result, index) => {
      // Alternate between broker types for each trade
      const brokerType = brokerTypes[index % brokerTypes.length];
      currentState = processGroupTrade(currentState, brokerType, result);
    });
    
    setState(currentState);
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
    setMainTab("config");
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
    setMainTab("simulation");
  };

  // Calculate summary for quick view
  const cfdGroups = config.groups.filter(g => g.brokerType === 'cfd');
  const futuresGroups = config.groups.filter(g => g.brokerType === 'futures');
  const totalAccounts = config.groups.reduce((sum, g) => sum + g.accounts.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      <Header userName={user?.email} />

      {/* Title Section */}
      <div className="border-b border-border/50 backdrop-blur-sm bg-card/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  <span className="text-foreground">FLIP X5</span>{" "}
                  <span className="text-primary">ROTACIONAL</span>
                </h1>
                <p className="text-xs text-muted-foreground">
                  Simulador de Grupos CFD + Futuros
                </p>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <LoadSimulationDialog
                simulations={simulations}
                loading={loadingSimulations}
                onLoad={handleLoadSimulation}
                onDelete={deleteSimulation}
              />
              {isSimulationActive && (
                <>
                  <SaveSimulationDialog
                    onSave={handleSaveSimulation}
                    currentName={currentSimulationName}
                    isUpdate={!!currentSimulationId}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNewSimulation}
                  >
                    Nueva
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Config Summary Bar - Always visible when simulation active */}
        {isSimulationActive && state && (
          <div className="mb-4 p-3 bg-card/50 rounded-lg border border-border/50">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4 flex-wrap">
                {/* CFD Summary */}
                {cfdGroups.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-md">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium">CFD</span>
                    <Badge variant="outline" className="text-xs">
                      {cfdGroups.length} grupos · ${cfdGroups[0]?.riskPerTrade}/trade
                    </Badge>
                  </div>
                )}
                
                {/* Futures Summary */}
                {futuresGroups.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 rounded-md">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-sm font-medium">Futuros</span>
                    <Badge variant="outline" className="text-xs">
                      {futuresGroups.length} grupos · ${futuresGroups[0]?.riskPerTrade}/trade
                    </Badge>
                  </div>
                )}

                {/* Simulation name */}
                {currentSimulationName && (
                  <Badge variant="secondary" className="text-xs">
                    📁 {currentSimulationName}
                  </Badge>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  disabled={state.trades.length === 0}
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMainTab("config")}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-xl mb-6">
            <TabsTrigger value="config" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configurar</span>
            </TabsTrigger>
            <TabsTrigger value="trades" className="gap-2" disabled={!isSimulationActive}>
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">Trades</span>
            </TabsTrigger>
            <TabsTrigger value="simulation" className="gap-2" disabled={!isSimulationActive}>
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Simulación</span>
            </TabsTrigger>
            <TabsTrigger value="projection" className="gap-2" disabled={!isSimulationActive}>
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Proyección</span>
            </TabsTrigger>
          </TabsList>

          {/* CONFIG TAB */}
          <TabsContent value="config" className="space-y-6">
            <GroupConfigForm
              config={config}
              onConfigChange={setConfig}
              onStart={handleStartSimulation}
              isSimulationActive={isSimulationActive}
            />
            
            {isSimulationActive && (
              <div className="text-center pt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  ⚠️ La simulación está activa. Los cambios de configuración no afectarán la simulación en curso.
                </p>
                <Button variant="outline" onClick={() => setMainTab("trades")}>
                  Ir a Trades →
                </Button>
              </div>
            )}
          </TabsContent>

          {/* TRADES TAB */}
          <TabsContent value="trades" className="space-y-6">
            {state && (
              <>
                {/* Quick manual trade buttons */}
                <Card className="bg-card/50 border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Play className="h-4 w-4 text-primary" />
                      Trade Rápido (Manual)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* CFD Quick Trade */}
                      {cfdGroups.length > 0 && (
                        <div className="p-4 border border-blue-500/30 rounded-lg bg-blue-500/5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-500" />
                              <span className="font-medium">CFD</span>
                              <span className="text-xs text-muted-foreground">
                                ${cfdGroups[0]?.riskPerTrade} riesgo
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Turno: {state.groups.filter(g => g.brokerType === 'cfd')[state.currentTurnByBroker['cfd'] || 0]?.name}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="flex-1 border-emerald-500/50 hover:bg-emerald-500/10"
                              onClick={() => handleTradeResult('cfd', 'TP')}
                            >
                              <TrendingUp className="h-4 w-4 mr-1 text-emerald-500" />
                              TP +${(cfdGroups[0]?.riskPerTrade || 0) * config.riskRewardRatio}
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 border-red-500/50 hover:bg-red-500/10"
                              onClick={() => handleTradeResult('cfd', 'SL')}
                            >
                              <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
                              SL -${cfdGroups[0]?.riskPerTrade}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Futures Quick Trade */}
                      {futuresGroups.length > 0 && (
                        <div className="p-4 border border-amber-500/30 rounded-lg bg-amber-500/5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-amber-500" />
                              <span className="font-medium">Futuros</span>
                              <span className="text-xs text-muted-foreground">
                                ${futuresGroups[0]?.riskPerTrade} riesgo
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Turno: {state.groups.filter(g => g.brokerType === 'futures')[state.currentTurnByBroker['futures'] || 0]?.name}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="flex-1 border-emerald-500/50 hover:bg-emerald-500/10"
                              onClick={() => handleTradeResult('futures', 'TP')}
                            >
                              <TrendingUp className="h-4 w-4 mr-1 text-emerald-500" />
                              TP +${(futuresGroups[0]?.riskPerTrade || 0) * config.riskRewardRatio}
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 border-red-500/50 hover:bg-red-500/10"
                              onClick={() => handleTradeResult('futures', 'SL')}
                            >
                              <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
                              SL -${futuresGroups[0]?.riskPerTrade}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Trade Selector */}
                <GroupTradeSelector
                  onTradesSelected={handleBatchTrades}
                  disabled={false}
                />

                {/* Trade History */}
                <GroupTradeHistory trades={state.trades} />
              </>
            )}
          </TabsContent>

          {/* SIMULATION TAB */}
          <TabsContent value="simulation" className="space-y-6">
            {state && (
              <>
                <GroupSummaryCards state={state} />
                <GroupSimulationDisplay
                  state={state}
                  onTradeResult={handleTradeResult}
                />
              </>
            )}
          </TabsContent>

          {/* PROJECTION TAB */}
          <TabsContent value="projection" className="space-y-6">
            {state && (
              <WithdrawalProjection state={state} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FlipRotational;