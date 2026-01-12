import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  Calendar, 
  CheckCircle, 
  Target, 
  TrendingUp, 
  TrendingDown,
  Percent,
  BarChart3
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
} from "recharts";

interface StatsData {
  totalDays: number;
  completedDays: number;
  avgCompletion: number;
  tradingDays: number;
  noTradeDays: number;
  // Checklist entries stats
  checklistEntries: number;
  checklistTPs: number;
  checklistSLs: number;
  checklistWinRate: number;
  // Dashboard trades stats (correlated with checklists)
  dashboardTrades: number;
  dashboardTPs: number;
  dashboardSLs: number;
  dashboardWinRate: number;
  // Correlation: discipline vs dashboard trades
  disciplineCorrelation: {
    high: { trades: number; winRate: number; pnl: number };
    medium: { trades: number; winRate: number; pnl: number };
    low: { trades: number; winRate: number; pnl: number };
    noChecklist: { trades: number; winRate: number; pnl: number };
  };
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
      .eq('user_id', user.id);

    // Fetch all dashboard trades
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id);

    if (checklistError) {
      setLoading(false);
      return;
    }

    const allChecklists = checklists || [];
    const allTrades = trades || [];

    // Fetch all checklist entries
    const checklistIds = allChecklists.map(c => c.id);
    const { data: entries } = checklistIds.length > 0 
      ? await supabase.from('checklist_entries').select('*').in('checklist_id', checklistIds)
      : { data: [] };

    // Calculate basic checklist stats
    const totalDays = allChecklists.length;
    const completedDays = allChecklists.filter(c => c.is_completed).length;
    const avgCompletion = totalDays > 0 
      ? Math.round(allChecklists.reduce((acc, c) => acc + c.completion_percentage, 0) / totalDays)
      : 0;
    const tradingDays = allChecklists.filter(c => c.executed_entry === true).length;
    const noTradeDays = allChecklists.filter(c => c.entry_conditions_met === false || c.executed_entry === false).length;

    // Checklist entries stats
    const allEntries = entries || [];
    const completedEntries = allEntries.filter(e => e.result !== null);
    const checklistTPs = allEntries.filter(e => e.result === 'TP').length;
    const checklistSLs = allEntries.filter(e => e.result === 'SL').length;
    const checklistWinRate = completedEntries.length > 0 
      ? Math.round((checklistTPs / completedEntries.length) * 100)
      : 0;

    // Create a map of date -> completion_percentage for quick lookup
    const checklistByDate = new Map<string, number>();
    allChecklists.forEach(c => {
      checklistByDate.set(c.date, c.completion_percentage);
    });

    // Categorize dashboard trades by checklist discipline level
    const highDisciplineTrades: typeof allTrades = [];
    const mediumDisciplineTrades: typeof allTrades = [];
    const lowDisciplineTrades: typeof allTrades = [];
    const noChecklistTrades: typeof allTrades = [];

    allTrades.forEach(trade => {
      const completion = checklistByDate.get(trade.date);
      if (completion === undefined) {
        noChecklistTrades.push(trade);
      } else if (completion >= 80) {
        highDisciplineTrades.push(trade);
      } else if (completion >= 50) {
        mediumDisciplineTrades.push(trade);
      } else {
        lowDisciplineTrades.push(trade);
      }
    });

    const calculateGroupStats = (groupTrades: typeof allTrades) => {
      const tps = groupTrades.filter(t => t.result_type === 'TP').length;
      const sls = groupTrades.filter(t => t.result_type === 'SL').length;
      const total = tps + sls;
      const winRate = total > 0 ? Math.round((tps / total) * 100) : 0;
      const pnl = groupTrades.reduce((acc, t) => acc + Number(t.result_dollars), 0);
      return { trades: groupTrades.length, winRate, pnl };
    };

    // Dashboard trades overall stats
    const dashboardTPs = allTrades.filter(t => t.result_type === 'TP').length;
    const dashboardSLs = allTrades.filter(t => t.result_type === 'SL').length;
    const dashboardTotal = dashboardTPs + dashboardSLs;
    const dashboardWinRate = dashboardTotal > 0 
      ? Math.round((dashboardTPs / dashboardTotal) * 100)
      : 0;

    setStats({
      totalDays,
      completedDays,
      avgCompletion,
      tradingDays,
      noTradeDays,
      checklistEntries: allEntries.length,
      checklistTPs,
      checklistSLs,
      checklistWinRate,
      dashboardTrades: allTrades.length,
      dashboardTPs,
      dashboardSLs,
      dashboardWinRate,
      disciplineCorrelation: {
        high: calculateGroupStats(highDisciplineTrades),
        medium: calculateGroupStats(mediumDisciplineTrades),
        low: calculateGroupStats(lowDisciplineTrades),
        noChecklist: calculateGroupStats(noChecklistTrades),
      },
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

  if (!stats || stats.totalDays === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            No hay suficientes datos para mostrar estadísticas.
            Completa algunos checklists primero.
          </p>
        </CardContent>
      </Card>
    );
  }

  const correlationData = [
    {
      name: "Alta (≥80%)",
      winRate: stats.disciplineCorrelation.high.winRate,
      trades: stats.disciplineCorrelation.high.trades,
      pnl: stats.disciplineCorrelation.high.pnl,
    },
    {
      name: "Media (50-79%)",
      winRate: stats.disciplineCorrelation.medium.winRate,
      trades: stats.disciplineCorrelation.medium.trades,
      pnl: stats.disciplineCorrelation.medium.pnl,
    },
    {
      name: "Baja (<50%)",
      winRate: stats.disciplineCorrelation.low.winRate,
      trades: stats.disciplineCorrelation.low.trades,
      pnl: stats.disciplineCorrelation.low.pnl,
    },
    {
      name: "Sin Checklist",
      winRate: stats.disciplineCorrelation.noChecklist.winRate,
      trades: stats.disciplineCorrelation.noChecklist.trades,
      pnl: stats.disciplineCorrelation.noChecklist.pnl,
    },
  ];

  const getBarColor = (winRate: number) => {
    if (winRate >= 60) return "hsl(var(--success))";
    if (winRate >= 40) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalDays}</p>
                <p className="text-xs text-muted-foreground">Días analizados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedDays}</p>
                <p className="text-xs text-muted-foreground">100% completados</p>
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
                <p className="text-2xl font-bold">{stats.avgCompletion}%</p>
                <p className="text-xs text-muted-foreground">Completitud media</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Target className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.dashboardWinRate}%</p>
                <p className="text-xs text-muted-foreground">Win Rate Dashboard</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trading Stats - Two sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Checklist Entries Stats */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Entradas Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Días operados (checklist)</span>
                <span className="font-bold">{stats.tradingDays}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Días sin operar</span>
                <span className="font-bold">{stats.noTradeDays}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total entradas (checklist)</span>
                <span className="font-bold">{stats.checklistEntries}</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  Take Profits
                </span>
                <span className="font-bold text-success">{stats.checklistTPs}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  Stop Losses
                </span>
                <span className="font-bold text-destructive">{stats.checklistSLs}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Win Rate Checklist</span>
                <span className="font-bold text-primary">{stats.checklistWinRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Trades Stats */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Trades Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total trades</span>
                <span className="font-bold">{stats.dashboardTrades}</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  Take Profits
                </span>
                <span className="font-bold text-success">{stats.dashboardTPs}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  Stop Losses
                </span>
                <span className="font-bold text-destructive">{stats.dashboardSLs}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Win Rate Dashboard</span>
                <span className="font-bold text-primary">{stats.dashboardWinRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Discipline Correlation */}
      <div className="grid grid-cols-1 gap-6">

        {/* Discipline Correlation Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Correlación Disciplina Checklist vs Trades Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={correlationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string, props: { payload: typeof correlationData[0] }) => {
                    if (name === 'winRate') {
                      return [`${value}%`, 'Win Rate'];
                    }
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Disciplina: ${label}`}
                />
                <Bar dataKey="winRate" radius={[0, 4, 4, 0]}>
                  {correlationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.winRate)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            {/* Detailed breakdown */}
            <div className="mt-4 space-y-2">
              {correlationData.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm p-2 rounded bg-muted/50">
                  <span className="font-medium">{item.name}</span>
                  <div className="flex gap-4">
                    <span className="text-muted-foreground">
                      {item.trades} trades
                    </span>
                    <span className={item.pnl >= 0 ? "text-success" : "text-destructive"}>
                      ${item.pnl.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-xs text-muted-foreground text-center mt-4">
              Este gráfico correlaciona el % de completitud del checklist con los resultados de tus trades del Dashboard (por fecha).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
