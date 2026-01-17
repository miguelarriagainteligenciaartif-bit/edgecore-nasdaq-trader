import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Percent,
  BarChart3,
  AlertCircle,
  ClipboardCheck,
  ClipboardX,
  CalendarRange
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface StatsData {
  // Analysis period
  firstChecklistDate: string;
  totalChecklistDays: number;
  // Dashboard trades breakdown by checklist (only from first checklist date)
  tradesWithChecklist: {
    total: number;
    tps: number;
    sls: number;
    winRate: number;
    pnl: number;
  };
  tradesWithoutChecklist: {
    total: number;
    tps: number;
    sls: number;
    winRate: number;
    pnl: number;
  };
  // Overall stats (from first checklist date)
  totalAnalyzedTrades: number;
  totalAnalyzedTPs: number;
  totalAnalyzedSLs: number;
  totalAnalyzedWinRate: number;
  totalAnalyzedPnL: number;
  // Historical trades (before first checklist)
  historicalTrades: number;
  historicalPnL: number;
}

export const ChecklistStats = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch all checklists
    const { data: checklists, error: checklistError } = await supabase
      .from('daily_checklists')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    // Fetch all dashboard trades
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id);

    if (checklistError || tradesError) {
      setLoading(false);
      return;
    }

    const allChecklists = checklists || [];
    const allTrades = trades || [];

    // Get the first checklist date (when user started using the feature)
    const firstChecklistDate = allChecklists.length > 0 ? allChecklists[0].date : null;

    if (!firstChecklistDate) {
      setLoading(false);
      return;
    }

    // Create a set of dates that have checklists
    const checklistDates = new Set(allChecklists.map(c => c.date));
    const totalChecklistDays = allChecklists.length;

    // Filter trades: only those from the first checklist date onwards
    const analyzedTrades = allTrades.filter(t => t.date >= firstChecklistDate);
    const historicalTrades = allTrades.filter(t => t.date < firstChecklistDate);

    // Separate analyzed trades by whether they have a checklist on that date
    const tradesWithChecklistArr = analyzedTrades.filter(t => checklistDates.has(t.date));
    const tradesWithoutChecklistArr = analyzedTrades.filter(t => !checklistDates.has(t.date));

    // Calculate stats for trades WITH checklist
    const withChecklistTPs = tradesWithChecklistArr.filter(t => t.result_type === 'TP').length;
    const withChecklistSLs = tradesWithChecklistArr.filter(t => t.result_type === 'SL').length;
    const withChecklistTotal = withChecklistTPs + withChecklistSLs;
    const withChecklistWinRate = withChecklistTotal > 0 
      ? Math.round((withChecklistTPs / withChecklistTotal) * 100) 
      : 0;
    const withChecklistPnL = tradesWithChecklistArr.reduce((acc, t) => acc + Number(t.result_dollars), 0);

    // Calculate stats for trades WITHOUT checklist
    const withoutChecklistTPs = tradesWithoutChecklistArr.filter(t => t.result_type === 'TP').length;
    const withoutChecklistSLs = tradesWithoutChecklistArr.filter(t => t.result_type === 'SL').length;
    const withoutChecklistTotal = withoutChecklistTPs + withoutChecklistSLs;
    const withoutChecklistWinRate = withoutChecklistTotal > 0 
      ? Math.round((withoutChecklistTPs / withoutChecklistTotal) * 100) 
      : 0;
    const withoutChecklistPnL = tradesWithoutChecklistArr.reduce((acc, t) => acc + Number(t.result_dollars), 0);

    // Overall analyzed stats
    const totalAnalyzedTPs = analyzedTrades.filter(t => t.result_type === 'TP').length;
    const totalAnalyzedSLs = analyzedTrades.filter(t => t.result_type === 'SL').length;
    const totalAnalyzedTotal = totalAnalyzedTPs + totalAnalyzedSLs;
    const totalAnalyzedWinRate = totalAnalyzedTotal > 0
      ? Math.round((totalAnalyzedTPs / totalAnalyzedTotal) * 100)
      : 0;
    const totalAnalyzedPnL = analyzedTrades.reduce((acc, t) => acc + Number(t.result_dollars), 0);

    // Historical stats
    const historicalPnL = historicalTrades.reduce((acc, t) => acc + Number(t.result_dollars), 0);

    setStats({
      firstChecklistDate,
      totalChecklistDays,
      tradesWithChecklist: {
        total: tradesWithChecklistArr.length,
        tps: withChecklistTPs,
        sls: withChecklistSLs,
        winRate: withChecklistWinRate,
        pnl: withChecklistPnL,
      },
      tradesWithoutChecklist: {
        total: tradesWithoutChecklistArr.length,
        tps: withoutChecklistTPs,
        sls: withoutChecklistSLs,
        winRate: withoutChecklistWinRate,
        pnl: withoutChecklistPnL,
      },
      totalAnalyzedTrades: analyzedTrades.length,
      totalAnalyzedTPs,
      totalAnalyzedSLs,
      totalAnalyzedWinRate,
      totalAnalyzedPnL,
      historicalTrades: historicalTrades.length,
      historicalPnL,
    });

    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            No has completado ningún checklist todavía.
            Completa tu primer checklist para empezar a ver estadísticas.
          </p>
        </CardContent>
      </Card>
    );
  }

  const comparisonData = [
    {
      name: "Con Checklist",
      winRate: stats.tradesWithChecklist.winRate,
      trades: stats.tradesWithChecklist.total,
      pnl: stats.tradesWithChecklist.pnl,
    },
    {
      name: "Sin Checklist",
      winRate: stats.tradesWithoutChecklist.winRate,
      trades: stats.tradesWithoutChecklist.total,
      pnl: stats.tradesWithoutChecklist.pnl,
    },
  ];

  const pieData = [
    {
      name: "Con Checklist",
      value: stats.tradesWithChecklist.total,
      fill: "hsl(var(--success))",
    },
    {
      name: "Sin Checklist",
      value: stats.tradesWithoutChecklist.total,
      fill: "hsl(var(--muted-foreground))",
    },
  ];

  const getBarColor = (winRate: number) => {
    if (winRate >= 60) return "hsl(var(--success))";
    if (winRate >= 40) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  };

  const winRateDiff = stats.tradesWithChecklist.winRate - stats.tradesWithoutChecklist.winRate;
  const formattedFirstDate = format(new Date(stats.firstChecklistDate), "d 'de' MMMM, yyyy", { locale: es });

  return (
    <div className="space-y-6">
      {/* Analysis Period Banner */}
      <Card className="bg-primary/10 border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CalendarRange className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-primary">Período de análisis</p>
              <p className="text-muted-foreground mt-1">
                Analizando trades desde el <strong>{formattedFirstDate}</strong> (tu primer checklist).
                {stats.historicalTrades > 0 && (
                  <span className="block mt-1 text-xs">
                    {stats.historicalTrades} trades anteriores no se incluyen en la comparación 
                    (P&L histórico: <span className={stats.historicalPnL >= 0 ? 'text-success' : 'text-destructive'}>${stats.historicalPnL.toFixed(0)}</span>)
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalAnalyzedTrades}</p>
                <p className="text-xs text-muted-foreground">Trades analizados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Calendar className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalChecklistDays}</p>
                <p className="text-xs text-muted-foreground">Días con Checklist</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Percent className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalAnalyzedWinRate}%</p>
                <p className="text-xs text-muted-foreground">Win Rate período</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stats.totalAnalyzedPnL >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                {stats.totalAnalyzedPnL >= 0 
                  ? <TrendingUp className="h-5 w-5 text-success" />
                  : <TrendingDown className="h-5 w-5 text-destructive" />
                }
              </div>
              <div>
                <p className={`text-2xl font-bold ${stats.totalAnalyzedPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                  ${stats.totalAnalyzedPnL.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">P&L período</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trades CON Checklist */}
        <Card className="bg-card border-border border-l-4 border-l-success">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-success" />
              Días CON Checklist
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Trades en días que completaste el checklist
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-4 bg-success/10 rounded-lg">
                <p className="text-4xl font-bold text-success">{stats.tradesWithChecklist.total}</p>
                <p className="text-sm text-muted-foreground">trades</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xl font-bold text-success">{stats.tradesWithChecklist.tps}</p>
                  <p className="text-xs text-muted-foreground">Take Profits</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xl font-bold text-destructive">{stats.tradesWithChecklist.sls}</p>
                  <p className="text-xs text-muted-foreground">Stop Losses</p>
                </div>
              </div>

              <div className="h-px bg-border" />

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Win Rate</span>
                <span className="text-xl font-bold text-primary">{stats.tradesWithChecklist.winRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">P&L</span>
                <span className={`text-xl font-bold ${stats.tradesWithChecklist.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                  ${stats.tradesWithChecklist.pnl.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trades SIN Checklist */}
        <Card className="bg-card border-border border-l-4 border-l-muted-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardX className="h-5 w-5 text-muted-foreground" />
              Días SIN Checklist
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Trades en días que NO completaste el checklist
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-4xl font-bold">{stats.tradesWithoutChecklist.total}</p>
                <p className="text-sm text-muted-foreground">trades</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xl font-bold text-success">{stats.tradesWithoutChecklist.tps}</p>
                  <p className="text-xs text-muted-foreground">Take Profits</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xl font-bold text-destructive">{stats.tradesWithoutChecklist.sls}</p>
                  <p className="text-xs text-muted-foreground">Stop Losses</p>
                </div>
              </div>

              <div className="h-px bg-border" />

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Win Rate</span>
                <span className="text-xl font-bold text-primary">{stats.tradesWithoutChecklist.winRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">P&L</span>
                <span className={`text-xl font-bold ${stats.tradesWithoutChecklist.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                  ${stats.tradesWithoutChecklist.pnl.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Win Rate Comparison Chart */}
      {stats.totalAnalyzedTrades > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Comparativa Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={comparisonData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value}%`, 'Win Rate']}
                />
                <Bar dataKey="winRate" radius={[0, 4, 4, 0]}>
                  {comparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.winRate)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            {/* Insight */}
            {stats.tradesWithChecklist.total >= 3 && stats.tradesWithoutChecklist.total >= 3 && (
              <div className={`mt-4 p-4 rounded-lg text-center ${winRateDiff > 0 ? 'bg-success/10' : winRateDiff < 0 ? 'bg-destructive/10' : 'bg-muted/50'}`}>
                {winRateDiff > 0 ? (
                  <p className="text-sm">
                    <TrendingUp className="inline h-4 w-4 text-success mr-1" />
                    <strong className="text-success">+{winRateDiff}%</strong> mejor Win Rate cuando usas el Checklist
                  </p>
                ) : winRateDiff < 0 ? (
                  <p className="text-sm">
                    <TrendingDown className="inline h-4 w-4 text-destructive mr-1" />
                    <strong className="text-destructive">{winRateDiff}%</strong> peor Win Rate cuando usas el Checklist
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Mismo Win Rate con y sin Checklist
                  </p>
                )}
              </div>
            )}

            {(stats.tradesWithChecklist.total < 3 || stats.tradesWithoutChecklist.total < 3) && (
              <div className="mt-4 p-4 bg-primary/10 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  <AlertCircle className="inline h-4 w-4 text-primary mr-1" />
                  Necesitas al menos 3 trades en cada categoría para ver insights significativos.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Distribution Pie Chart */}
      {stats.totalAnalyzedTrades > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Distribución de Trades (desde {formattedFirstDate})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => [
                      `${value} trades (${Math.round((value / stats.totalAnalyzedTrades) * 100)}%)`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-success"></div>
                  <span className="text-sm">Con Checklist: <strong>{stats.tradesWithChecklist.total}</strong> trades ({Math.round((stats.tradesWithChecklist.total / stats.totalAnalyzedTrades) * 100)}%)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-muted-foreground"></div>
                  <span className="text-sm">Sin Checklist: <strong>{stats.tradesWithoutChecklist.total}</strong> trades ({Math.round((stats.tradesWithoutChecklist.total / stats.totalAnalyzedTrades) * 100)}%)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
