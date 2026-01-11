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
  totalEntries: number;
  totalTPs: number;
  totalSLs: number;
  winRate: number;
  disciplineCorrelation: {
    high: { trades: number; winRate: number };
    medium: { trades: number; winRate: number };
    low: { trades: number; winRate: number };
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

    // Fetch all checklists with entries
    const { data: checklists, error } = await supabase
      .from('daily_checklists')
      .select('*')
      .eq('user_id', user.id);

    if (error || !checklists) {
      setLoading(false);
      return;
    }

    // Fetch all entries
    const checklistIds = checklists.map(c => c.id);
    const { data: entries } = await supabase
      .from('checklist_entries')
      .select('*')
      .in('checklist_id', checklistIds);

    // Calculate stats
    const totalDays = checklists.length;
    const completedDays = checklists.filter(c => c.is_completed).length;
    const avgCompletion = totalDays > 0 
      ? Math.round(checklists.reduce((acc, c) => acc + c.completion_percentage, 0) / totalDays)
      : 0;
    const tradingDays = checklists.filter(c => c.executed_entry === true).length;
    const noTradeDays = checklists.filter(c => c.entry_conditions_met === false || c.executed_entry === false).length;

    const allEntries = entries || [];
    const completedEntries = allEntries.filter(e => e.result !== null);
    const totalTPs = allEntries.filter(e => e.result === 'TP').length;
    const totalSLs = allEntries.filter(e => e.result === 'SL').length;
    const winRate = completedEntries.length > 0 
      ? Math.round((totalTPs / completedEntries.length) * 100)
      : 0;

    // Calculate discipline correlation
    const highDiscipline = checklists.filter(c => c.completion_percentage >= 80);
    const mediumDiscipline = checklists.filter(c => c.completion_percentage >= 50 && c.completion_percentage < 80);
    const lowDiscipline = checklists.filter(c => c.completion_percentage < 50);

    const calculateGroupWinRate = (checklistGroup: typeof checklists) => {
      const ids = checklistGroup.map(c => c.id);
      const groupEntries = allEntries.filter(e => ids.includes(e.checklist_id) && e.result !== null);
      const groupTPs = groupEntries.filter(e => e.result === 'TP').length;
      return groupEntries.length > 0 ? Math.round((groupTPs / groupEntries.length) * 100) : 0;
    };

    setStats({
      totalDays,
      completedDays,
      avgCompletion,
      tradingDays,
      noTradeDays,
      totalEntries: allEntries.length,
      totalTPs,
      totalSLs,
      winRate,
      disciplineCorrelation: {
        high: { 
          trades: highDiscipline.length, 
          winRate: calculateGroupWinRate(highDiscipline) 
        },
        medium: { 
          trades: mediumDiscipline.length, 
          winRate: calculateGroupWinRate(mediumDiscipline) 
        },
        low: { 
          trades: lowDiscipline.length, 
          winRate: calculateGroupWinRate(lowDiscipline) 
        },
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
    },
    {
      name: "Media (50-79%)",
      winRate: stats.disciplineCorrelation.medium.winRate,
      trades: stats.disciplineCorrelation.medium.trades,
    },
    {
      name: "Baja (<50%)",
      winRate: stats.disciplineCorrelation.low.winRate,
      trades: stats.disciplineCorrelation.low.trades,
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
                <p className="text-2xl font-bold">{stats.winRate}%</p>
                <p className="text-xs text-muted-foreground">Win Rate global</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trading Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Resumen de Trading
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Días operados</span>
                <span className="font-bold">{stats.tradingDays}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Días sin operar</span>
                <span className="font-bold">{stats.noTradeDays}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total entradas</span>
                <span className="font-bold">{stats.totalEntries}</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  Take Profits
                </span>
                <span className="font-bold text-success">{stats.totalTPs}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  Stop Losses
                </span>
                <span className="font-bold text-destructive">{stats.totalSLs}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Discipline Correlation Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Correlación Disciplina vs Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={correlationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string) => [`${value}%`, 'Win Rate']}
                  labelFormatter={(label) => `Disciplina: ${label}`}
                />
                <Bar dataKey="winRate" radius={[0, 4, 4, 0]}>
                  {correlationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.winRate)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Este gráfico muestra cómo tu % de completitud del checklist correlaciona con tus resultados.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
