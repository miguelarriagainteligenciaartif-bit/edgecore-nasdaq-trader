import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown, DollarSign, Percent, ExternalLink, Image as ImageIcon } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { TradeForm } from "@/components/TradeForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell } from "recharts";
import { toast } from "sonner";

interface BacktestTrade {
  id: string;
  date: string;
  day_of_week: string;
  week_of_month: number;
  entry_time: string;
  exit_time: string | null;
  entry_model: string;
  trade_type: string;
  result_type: string;
  result_dollars: number;
  had_news: boolean;
  news_time: string | null;
  news_description: string | null;
  custom_news_description: string | null;
  execution_timing: string | null;
  no_trade_day: boolean;
  image_link: string | null;
}

const Backtesting = () => {
  const navigate = useNavigate();
  const [trades, setTrades] = useState<BacktestTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchTrades();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchTrades = async () => {
    try {
      const { data, error } = await supabase
        .from("backtest_trades")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      setTrades(data || []);
    } catch (error) {
      console.error("Error fetching backtest trades:", error);
      toast.error("Error al cargar operaciones de backtesting");
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = () => {
    const actualTrades = trades.filter(t => !t.no_trade_day);
    const totalTrades = actualTrades.length;
    const winningTrades = actualTrades.filter(t => t.result_type === "TP").length;
    const losingTrades = actualTrades.filter(t => t.result_type === "SL").length;
    const breakEvenTrades = actualTrades.filter(t => t.result_type === "Break Even").length;
    
    const totalProfit = actualTrades.reduce((sum, t) => sum + Number(t.result_dollars), 0);
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    
    const avgWin = winningTrades > 0 
      ? actualTrades.filter(t => t.result_type === "TP").reduce((sum, t) => sum + Number(t.result_dollars), 0) / winningTrades 
      : 0;
    const avgLoss = losingTrades > 0 
      ? Math.abs(actualTrades.filter(t => t.result_type === "SL").reduce((sum, t) => sum + Number(t.result_dollars), 0) / losingTrades)
      : 0;
    
    const expectedValue = totalTrades > 0 ? (winRate / 100 * avgWin) - ((1 - winRate / 100) * avgLoss) : 0;

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      breakEvenTrades,
      totalProfit,
      winRate,
      avgWin,
      avgLoss,
      expectedValue
    };
  };

  const getAnalysisByEntryModel = () => {
    const models = ["M1", "M3", "Continuación"];
    return models.map(model => {
      const modelTrades = trades.filter(t => t.entry_model === model && !t.no_trade_day);
      const wins = modelTrades.filter(t => t.result_type === "TP").length;
      const total = modelTrades.length;
      const profit = modelTrades.reduce((sum, t) => sum + Number(t.result_dollars), 0);
      
      return {
        modelo: model,
        "Win Rate (%)": total > 0 ? Number(((wins / total) * 100).toFixed(1)) : 0,
        "Ganancia": Number(profit.toFixed(2)),
        operaciones: total
      };
    });
  };

  const getAnalysisByDayOfWeek = () => {
    const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
    return days.map(day => {
      const dayTrades = trades.filter(t => t.day_of_week === day && !t.no_trade_day);
      const wins = dayTrades.filter(t => t.result_type === "TP").length;
      const total = dayTrades.length;
      const profit = dayTrades.reduce((sum, t) => sum + Number(t.result_dollars), 0);
      
      return {
        día: day,
        "Win Rate (%)": total > 0 ? Number(((wins / total) * 100).toFixed(1)) : 0,
        "Ganancia": Number(profit.toFixed(2)),
        operaciones: total
      };
    });
  };

  const getEquityCurveData = () => {
    const sortedTrades = [...trades]
      .filter(t => !t.no_trade_day)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let cumulativeEquity = 0;
    return sortedTrades.map((trade) => {
      cumulativeEquity += Number(trade.result_dollars);
      return {
        date: new Date(trade.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
        equity: Number(cumulativeEquity.toFixed(2)),
        fullDate: trade.date
      };
    });
  };


  const metrics = calculateMetrics();
  const modelData = getAnalysisByEntryModel();
  const dayData = getAnalysisByDayOfWeek();
  const equityData = getEquityCurveData();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Backtesting</h1>
            <p className="text-muted-foreground">Prueba y analiza tu estrategia con datos históricos</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Añadir Operación
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nueva Operación de Backtesting</DialogTitle>
              </DialogHeader>
              <TradeForm 
                isBacktest={true}
                onSuccess={() => {
                  setIsDialogOpen(false);
                  fetchTrades();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Main Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatsCard
            title="Capital Actual"
            value={`$${metrics.totalProfit.toFixed(2)}`}
            icon={DollarSign}
            trend={metrics.totalProfit >= 0 ? "up" : "down"}
            subtitle="Equity acumulada"
          />
          <StatsCard
            title="Total de Operaciones"
            value={metrics.totalTrades}
            icon={DollarSign}
            trend="neutral"
          />
          <StatsCard
            title="Win Rate"
            value={`${metrics.winRate.toFixed(1)}%`}
            icon={Percent}
            trend={metrics.winRate >= 50 ? "up" : "down"}
          />
          <StatsCard
            title="Expected Value"
            value={`$${metrics.expectedValue.toFixed(2)}`}
            icon={TrendingUp}
            trend={metrics.expectedValue > 0 ? "up" : "down"}
            subtitle="Por operación"
          />
          <StatsCard
            title="Ganancia Total"
            value={`$${metrics.totalProfit.toFixed(2)}`}
            icon={metrics.totalProfit >= 0 ? TrendingUp : TrendingDown}
            trend={metrics.totalProfit >= 0 ? "up" : "down"}
          />
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Operaciones Ganadoras</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success">{metrics.winningTrades}</p>
              <p className="text-xs text-muted-foreground">Promedio: ${metrics.avgWin.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Operaciones Perdedoras</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">{metrics.losingTrades}</p>
              <p className="text-xs text-muted-foreground">Promedio: -${metrics.avgLoss.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Análisis por Modelo de Entrada</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={modelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="modelo" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      if (name === "Ganancia") return [`$${value}`, "Ganancia ($)"];
                      return [value, name];
                    }}
                  />
                  <Legend 
                    formatter={(value: string) => {
                      if (value === "Ganancia") return "Ganancia ($)";
                      return value;
                    }}
                  />
                  <Bar dataKey="Win Rate (%)" fill="hsl(var(--primary))" />
                  <Bar dataKey="Ganancia">
                    {modelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.Ganancia >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Análisis por Día de la Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dayData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="día" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      if (name === "Ganancia") return [`$${value}`, "Ganancia ($)"];
                      return [value, name];
                    }}
                  />
                  <Legend 
                    formatter={(value: string) => {
                      if (value === "Ganancia") return "Ganancia ($)";
                      return value;
                    }}
                  />
                  <Bar dataKey="Win Rate (%)" fill="hsl(var(--primary))" />
                  <Bar dataKey="Ganancia">
                    {dayData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.Ganancia >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Trades with Images */}
        <Card>
          <CardHeader>
            <CardTitle>Operaciones Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trades.filter(t => !t.no_trade_day).slice(0, 10).map((trade) => (
                <div key={trade.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-semibold">{new Date(trade.date).toLocaleDateString('es-ES')}</span>
                      <span className="text-xs text-muted-foreground">{trade.day_of_week}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        trade.result_type === 'TP' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                      }`}>
                        {trade.result_type}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Modelo: {trade.entry_model}</span>
                      <span>Tipo: {trade.trade_type}</span>
                      <span className={trade.result_dollars >= 0 ? 'text-success font-semibold' : 'text-destructive font-semibold'}>
                        ${Number(trade.result_dollars).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {trade.image_link && (
                    <a 
                      href={trade.image_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-accent transition-colors"
                    >
                      <ImageIcon className="h-4 w-4" />
                      Ver Chart
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Equity Curve */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Curva de Equity - Backtesting</CardTitle>
          </CardHeader>
          <CardContent>
            {equityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={equityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Equity ($)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Equity']}
                    labelFormatter={(label) => `Fecha: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="equity" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                No hay operaciones registradas todavía
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Backtesting;
