import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { FlipConfigForm } from "@/components/FlipConfigForm";
import { FlipTradeInput } from "@/components/FlipTradeInput";
import { FlipResultsTable } from "@/components/FlipResultsTable";
import { FlipSummaryCards } from "@/components/FlipSummaryCards";
import { FlipChart } from "@/components/FlipChart";
import { FlipConfig, TradeResult, simulateFlipX5 } from "@/utils/flipX5Simulator";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EdgecoreX5 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [config, setConfig] = useState<FlipConfig>(
    location.state?.config || {
      accountSize: 1000,
      cycleSize: 2,
      riskPerCycle: 200,
      rrRatio: 2.0,
      reinvestPercent: 80,
    }
  );
  const [trades, setTrades] = useState<TradeResult[]>(location.state?.trades || []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión para guardar");
      navigate("/auth");
      return;
    }

    try {
      const { error } = await supabase.from("flip_simulations").insert({
        user_id: user.id,
        name: `Simulación ${new Date().toLocaleString()}`,
        account_size: config.accountSize,
        cycle_size: config.cycleSize,
        risk_per_cycle: config.riskPerCycle,
        rr_ratio: config.rrRatio,
        reinvest_percent: config.reinvestPercent,
        trade_results: trades,
      });

      if (error) throw error;
      toast.success("Simulación guardada correctamente");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Error al guardar la simulación");
    }
  };

  const result = trades.length > 0 ? simulateFlipX5(config, trades) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      <Header userName={user?.email} />
      
      {/* Title Section */}
      <div className="border-b border-border/50 backdrop-blur-sm bg-card/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="text-foreground">EDGECORE X5</span>{" "}
                <span className="text-primary">SIMULATOR</span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Gestión de Riesgo con Apalancado Personalizado
              </p>
            </div>
            {trades.length > 0 && user && (
              <Button onClick={handleSave} variant="default" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 space-y-6">
        <FlipConfigForm initialConfig={config} onConfigChange={setConfig} />
        
        <FlipTradeInput trades={trades} onTradesChange={setTrades} />

        {result && (
          <>
            <FlipSummaryCards result={result} accountSize={config.accountSize} />
            <FlipChart result={result} />
            <FlipResultsTable result={result} />
          </>
        )}

        {trades.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground space-y-2">
              <p className="text-lg">👆 Agrega resultados de trades para ver la simulación</p>
              <p className="text-sm">TP para ganancias, SL para pérdidas</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EdgecoreX5;
