import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { StatsCard } from "@/components/StatsCard";
import { ReportGenerator } from "@/components/ReportGenerator";
import { DollarSign, TrendingUp, Target, Calendar, BarChart3, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Trade {
  id: string;
  date: string;
  day_of_week: string;
  week_of_month: number | null;
  entry_time: string | null;
  exit_time: string | null;
  trade_type: string | null;
  result_type: string | null;
  drawdown: number | null;
  entry_model: string | null;
  result_dollars: number | null;
  had_news: boolean;
  news_description: string | null;
  custom_news_description: string | null;
  news_time: string | null;
  execution_timing: string | null;
  no_trade_day: boolean;
  image_link: string | null;
  account_id: string | null;
  max_rr: number | null;
}

export default function Analytics() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
    loadTrades();
  };

  const loadTrades = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .order("date", { ascending: true });

    if (!error && data) {
      setTrades(data);
    }
    setLoading(false);
  };

  const actualTrades = trades.filter(t => !t.no_trade_day);
  const winningTrades = actualTrades.filter(t => t.result_type === "TP");
  const losingTrades = actualTrades.filter(t => t.result_type === "SL");

  // Calculate main metrics
  const totalPnL = actualTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0);
  const winRate = actualTrades.length > 0 ? (winningTrades.length / actualTrades.length * 100) : 0;
  const avgWin = winningTrades.length > 0 
    ? winningTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0) / winningTrades.length 
    : 0;
  const avgLoss = losingTrades.length > 0 
    ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0) / losingTrades.length)
    : 0;
  const expectedValue = avgWin * (winRate / 100) - avgLoss * (1 - winRate / 100);

  // Calculate average trade duration in minutes
  const tradesWithDuration = actualTrades.filter(t => t.entry_time && t.exit_time);
  const avgDurationMinutes = tradesWithDuration.length > 0
    ? tradesWithDuration.reduce((sum, t) => {
        const [entryHours, entryMinutes] = (t.entry_time || "00:00").split(":").map(Number);
        const [exitHours, exitMinutes] = (t.exit_time || "00:00").split(":").map(Number);
        const entryTotalMinutes = entryHours * 60 + entryMinutes;
        const exitTotalMinutes = exitHours * 60 + exitMinutes;
        return sum + (exitTotalMinutes - entryTotalMinutes);
      }, 0) / tradesWithDuration.length
    : 0;

  // Calculate average drawdown for TP trades
  const tpTradesWithDrawdown = winningTrades.filter(t => t.drawdown !== null && t.drawdown !== undefined);
  const avgDrawdownTP = tpTradesWithDrawdown.length > 0
    ? tpTradesWithDrawdown.reduce((sum, t) => sum + (t.drawdown || 0), 0) / tpTradesWithDrawdown.length
    : 0;

  // Calculate average max RR
  const tradesWithMaxRR = actualTrades.filter(t => t.max_rr !== null && t.max_rr !== undefined);
  const avgMaxRR = tradesWithMaxRR.length > 0
    ? tradesWithMaxRR.reduce((sum, t) => sum + (t.max_rr || 0), 0) / tradesWithMaxRR.length
    : 0;

  // Analysis by entry model
  const modelStats = ["M1", "M3", "Continuación"].map(model => {
    const modelTrades = actualTrades.filter(t => t.entry_model === model);
    const modelWins = modelTrades.filter(t => t.result_type === "TP");
    const modelPnL = modelTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0);
    const modelWinRate = modelTrades.length > 0 ? (modelWins.length / modelTrades.length * 100) : 0;
    
    return {
      name: model,
      operaciones: modelTrades.length,
      pnl: modelPnL,
      winRate: modelWinRate
    };
  });

  // Analysis by day of week
  const dayStats = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map(day => {
    const dayTrades = actualTrades.filter(t => t.day_of_week === day);
    const dayPnL = dayTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0);
    const dayWins = dayTrades.filter(t => t.result_type === "TP");
    const dayWinRate = dayTrades.length > 0 ? (dayWins.length / dayTrades.length * 100) : 0;
    
    return {
      name: day,
      operaciones: dayTrades.length,
      pnl: dayPnL,
      winRate: dayWinRate
    };
  });

  // Analysis by week of month
  const weekStats = [1, 2, 3, 4, 5].map(week => {
    const weekTrades = actualTrades.filter(t => t.week_of_month === week);
    const weekPnL = weekTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0);
    const weekWins = weekTrades.filter(t => t.result_type === "TP");
    const weekWinRate = weekTrades.length > 0 ? (weekWins.length / weekTrades.length * 100) : 0;
    
    return {
      name: `Semana ${week}`,
      operaciones: weekTrades.length,
      pnl: weekPnL,
      winRate: weekWinRate
    };
  });

  // Find best performers
  const bestDay = dayStats.reduce((best, current) => 
    current.pnl > best.pnl ? current : best, dayStats[0]);
  const bestWeek = weekStats.reduce((best, current) => 
    current.pnl > best.pnl ? current : best, weekStats[0]);
  const bestModel = modelStats.reduce((best, current) => 
    current.pnl > best.pnl ? current : best, modelStats[0]);

  // News analysis
  const tradesWithNews = actualTrades.filter(t => t.had_news);
  const newsWins = tradesWithNews.filter(t => t.result_type === "TP");
  const newsPnL = tradesWithNews.reduce((sum, t) => sum + (t.result_dollars || 0), 0);
  const newsWinRate = tradesWithNews.length > 0 ? (newsWins.length / tradesWithNews.length * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-6">
          <p className="text-center text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Análisis y Estadísticas</h1>
            <p className="text-muted-foreground mt-2">
              Métricas detalladas de tu rendimiento en trading
            </p>
          </div>
          <ReportGenerator trades={trades} />
        </div>

        {/* Main Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatsCard
            title="Win Rate"
            value={`${winRate.toFixed(1)}%`}
            subtitle={`${winningTrades.length} ganadoras de ${actualTrades.length}`}
            icon={Target}
            trend="up"
          />
          <StatsCard
            title="Expected Value"
            value={`$${expectedValue.toFixed(2)}`}
            subtitle="Expectativa por operación"
            icon={TrendingUp}
            trend={expectedValue >= 0 ? "up" : "down"}
          />
          <StatsCard
            title="Mejor Día"
            value={bestDay?.name || "N/A"}
            subtitle={`$${bestDay?.pnl.toFixed(2) || 0} de P&L`}
            icon={Calendar}
            trend="up"
          />
          <StatsCard
            title="Mejor Semana"
            value={bestWeek?.name || "N/A"}
            subtitle={`$${bestWeek?.pnl.toFixed(2) || 0} de P&L`}
            icon={Clock}
            trend="up"
          />
          <StatsCard
            title="RR Máximo Promedio"
            value={avgMaxRR > 0 ? avgMaxRR.toFixed(2) : "N/A"}
            subtitle={`${tradesWithMaxRR.length} ops con RR máx`}
            icon={TrendingUp}
            trend="up"
          />
        </div>

        {/* Additional Metrics */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader>
              <CardTitle>Mejor Modelo</CardTitle>
              <CardDescription>Modelo más rentable</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{bestModel?.name || "N/A"}</div>
              <p className="text-sm text-muted-foreground mt-2">
                ${bestModel?.pnl.toFixed(2) || 0} | WR: {bestModel?.winRate.toFixed(1) || 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Promedio de Ganancia</CardTitle>
              <CardDescription>Por operación ganadora</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">${avgWin.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground mt-2">
                {winningTrades.length} operaciones ganadoras
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Promedio de Pérdida</CardTitle>
              <CardDescription>Por operación perdedora</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">${avgLoss.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground mt-2">
                {losingTrades.length} operaciones perdedoras
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Duración Promedio</CardTitle>
              <CardDescription>Tiempo en operación</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{avgDurationMinutes.toFixed(0)} min</div>
              <p className="text-sm text-muted-foreground mt-2">
                {tradesWithDuration.length} operaciones con duración
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>DrawDown Promedio TP</CardTitle>
              <CardDescription>En operaciones ganadoras</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{(avgDrawdownTP * 100).toFixed(0)}%</div>
              <p className="text-sm text-muted-foreground mt-2">
                {tpTradesWithDrawdown.length} TPs con DrawDown registrado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analysis by Entry Model */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Análisis por Modelo de Entrada
            </CardTitle>
            <CardDescription>Rendimiento de cada modelo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={modelStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="pnl" fill="#8884d8" name="P&L ($)" />
                <Bar yAxisId="right" dataKey="winRate" fill="#82ca9d" name="Win Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Analysis by Day of Week */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Análisis por Día de la Semana
            </CardTitle>
            <CardDescription>Rendimiento por cada día</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dayStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="pnl" fill="#8884d8" name="P&L ($)" />
                <Bar yAxisId="right" dataKey="winRate" fill="#82ca9d" name="Win Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Analysis by Week of Month */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Análisis por Semana del Mes
            </CardTitle>
            <CardDescription>Rendimiento por semana del mes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weekStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="pnl" fill="#8884d8" name="P&L ($)" />
                <Bar yAxisId="right" dataKey="winRate" fill="#82ca9d" name="Win Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* News Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Análisis de Operaciones con Noticias
            </CardTitle>
            <CardDescription>Impacto de las noticias en el rendimiento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Operaciones con Noticias</p>
                <p className="text-2xl font-bold">{tradesWithNews.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">P&L con Noticias</p>
                <p className="text-2xl font-bold">${newsPnL.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Win Rate con Noticias</p>
                <p className="text-2xl font-bold">{newsWinRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
