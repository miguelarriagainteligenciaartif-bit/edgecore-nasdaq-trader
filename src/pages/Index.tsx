import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { StatsCard } from "@/components/StatsCard";
import { TradeForm } from "@/components/TradeForm";
import { DollarSign, TrendingUp, TrendingDown, Target, Calendar, Layers } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface Trade {
  id: string;
  date: string;
  entry_time: string;
  trade_type: string;
  result_type: string;
  entry_model: string;
  result_dollars: number;
}

export default function Index() {
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
      .order("date", { ascending: false })
      .order("entry_time", { ascending: false })
      .limit(50);

    if (!error && data) {
      setTrades(data);
    }
    setLoading(false);
  };

  const stats = {
    totalPnL: trades.reduce((sum, t) => sum + Number(t.result_dollars), 0),
    totalTrades: trades.length,
    winningTrades: trades.filter(t => t.result_type === "TP").length,
    losingTrades: trades.filter(t => t.result_type === "SL").length,
    m1Trades: trades.filter(t => t.entry_model === "M1"),
    m3Trades: trades.filter(t => t.entry_model === "M3"),
    contTrades: trades.filter(t => t.entry_model === "Continuación"),
  };

  const winRate = stats.totalTrades > 0 ? ((stats.winningTrades / stats.totalTrades) * 100).toFixed(1) : 0;

  // Prepare equity curve data
  let cumulative = 0;
  const equityCurve = trades
    .slice()
    .reverse()
    .map((trade, index) => {
      cumulative += Number(trade.result_dollars);
      return {
        trade: index + 1,
        equity: cumulative,
        date: trade.date,
      };
    });

  return (
    <div className="min-h-screen bg-background">
      <Header userName={user?.email} />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="P&L Total"
            value={`$${stats.totalPnL.toFixed(2)}`}
            icon={DollarSign}
            trend={stats.totalPnL >= 0 ? "up" : "down"}
          />
          <StatsCard
            title="Win Rate"
            value={`${winRate}%`}
            icon={Target}
            trend={Number(winRate) >= 50 ? "up" : "down"}
            subtitle={`${stats.winningTrades} TP / ${stats.losingTrades} SL`}
          />
          <StatsCard
            title="Total Operaciones"
            value={stats.totalTrades}
            icon={Calendar}
            trend="neutral"
          />
          <StatsCard
            title="Mejor Modelo"
            value={
              stats.m1Trades.length >= stats.m3Trades.length && stats.m1Trades.length >= stats.contTrades.length
                ? "M1"
                : stats.m3Trades.length >= stats.contTrades.length
                ? "M3"
                : "Continuación"
            }
            icon={Layers}
            trend="neutral"
          />
        </div>

        {/* Equity Curve */}
        {equityCurve.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Curva de Capital</CardTitle>
              <CardDescription>Progreso acumulado de P&L</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={equityCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="trade" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="equity"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Trade Form */}
        <TradeForm onSuccess={loadTrades} />

        {/* Recent Trades Table */}
        <Card>
          <CardHeader>
            <CardTitle>Operaciones Recientes</CardTitle>
            <CardDescription>Últimas 50 operaciones registradas</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Cargando...</p>
            ) : trades.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay operaciones registradas aún</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead className="text-right">P&L</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades.map((trade) => (
                      <TableRow key={trade.id}>
                        <TableCell>{trade.date}</TableCell>
                        <TableCell>{trade.entry_time}</TableCell>
                        <TableCell>
                          <Badge variant={trade.trade_type === "Compra" ? "default" : "secondary"}>
                            {trade.trade_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{trade.entry_model}</Badge>
                        </TableCell>
                        <TableCell>
                          {trade.result_type === "TP" ? (
                            <div className="flex items-center gap-1 text-success">
                              <TrendingUp className="h-4 w-4" />
                              <span className="font-medium">TP</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-destructive">
                              <TrendingDown className="h-4 w-4" />
                              <span className="font-medium">SL</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-mono font-medium",
                          Number(trade.result_dollars) >= 0 ? "text-success" : "text-destructive"
                        )}>
                          ${Number(trade.result_dollars).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
