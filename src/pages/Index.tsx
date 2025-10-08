import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { StatsCard } from "@/components/StatsCard";
import { TradeForm } from "@/components/TradeForm";
import { ReportGenerator } from "@/components/ReportGenerator";
import { AccountManager } from "@/components/AccountManager";
import { DollarSign, TrendingUp, TrendingDown, Target, Calendar, Layers } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";

interface Trade {
  id: string;
  date: string;
  day_of_week: string;
  entry_time: string | null;
  exit_time: string | null;
  trade_type: string | null;
  result_type: string | null;
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
}

export default function Index() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("all");

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

    const { data: accountsData } = await supabase
      .from("accounts")
      .select("*")
      .order("name");
    
    if (accountsData) {
      setAccounts(accountsData);
    }

    setLoading(false);
  };

  const filteredTrades = selectedAccount === "all" 
    ? trades 
    : trades.filter(t => t.account_id === selectedAccount);
  
  const actualTrades = filteredTrades.filter(t => !t.no_trade_day);
  const stats = {
    totalPnL: actualTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0),
    totalTrades: actualTrades.length,
    winningTrades: actualTrades.filter(t => t.result_type === "TP").length,
    losingTrades: actualTrades.filter(t => t.result_type === "SL").length,
    m1Trades: actualTrades.filter(t => t.entry_model === "M1"),
    m3Trades: actualTrades.filter(t => t.entry_model === "M3"),
    contTrades: actualTrades.filter(t => t.entry_model === "Continuación"),
  };

  const winRate = stats.totalTrades > 0 ? ((stats.winningTrades / stats.totalTrades) * 100).toFixed(1) : 0;

  // Prepare equity curve data with multiple lines for different accounts
  const CHART_COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  const equityCurveData = () => {
    if (selectedAccount !== "all") {
      // Single account curve
      let cumulative = 0;
      return actualTrades
        .slice()
        .reverse()
        .map((trade, index) => {
          cumulative += (trade.result_dollars || 0);
          return {
            trade: index + 1,
            equity: cumulative,
            date: trade.date,
          };
        });
    }

    // Multi-account curves
    const allAccountTrades = trades.filter(t => !t.no_trade_day);
    const tradesByDate = allAccountTrades.reduce((acc: any, trade) => {
      if (!acc[trade.date]) {
        acc[trade.date] = [];
      }
      acc[trade.date].push(trade);
      return acc;
    }, {});

    const dates = Object.keys(tradesByDate).sort();
    const accountCumulatives: Record<string, number> = {};
    
    // Initialize all accounts
    accounts.forEach(acc => {
      accountCumulatives[acc.id] = 0;
    });
    accountCumulatives["total"] = 0;

    return dates.map((date, index) => {
      const dayTrades = tradesByDate[date];
      const dataPoint: any = { trade: index + 1, date };

      // Update cumulatives for each account
      dayTrades.forEach((trade: Trade) => {
        if (trade.account_id) {
          accountCumulatives[trade.account_id] += (trade.result_dollars || 0);
        }
        accountCumulatives["total"] += (trade.result_dollars || 0);
      });

      // Add all account values to this data point
      accounts.forEach(acc => {
        dataPoint[acc.id] = accountCumulatives[acc.id];
      });
      dataPoint["total"] = accountCumulatives["total"];

      return dataPoint;
    });
  };

  const equityCurve = equityCurveData();

  return (
    <div className="min-h-screen bg-background">
      <Header userName={user?.email} />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Account Manager */}
        <AccountManager />

        {/* Account Filter and Report */}
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Filtrar por cuenta:</span>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="w-[250px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Cuentas (Agregado)</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} - {account.broker}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ReportGenerator trades={filteredTrades} />
        </div>

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
              <CardDescription>
                {selectedAccount === "all" 
                  ? "Progreso acumulado por cuenta y total agregado" 
                  : "Progreso acumulado de P&L"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
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
                  <Legend />
                  {selectedAccount === "all" ? (
                    <>
                      {accounts.map((account, idx) => (
                        <Line
                          key={account.id}
                          type="monotone"
                          dataKey={account.id}
                          name={account.name}
                          stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                      <Line
                        type="monotone"
                        dataKey="total"
                        name="Total Agregado"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{ fill: "hsl(var(--primary))" }}
                      />
                    </>
                  ) : (
                    <Line
                      type="monotone"
                      dataKey="equity"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  )}
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
                        <TableCell>{trade.entry_time || "N/A"}</TableCell>
                        <TableCell>
                          {trade.no_trade_day ? (
                            <Badge variant="outline" className="text-warning">Sin Entrada</Badge>
                          ) : (
                            <Badge variant={trade.trade_type === "Compra" ? "default" : "secondary"}>
                              {trade.trade_type}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{trade.entry_model || "N/A"}</Badge>
                        </TableCell>
                        <TableCell>
                          {trade.no_trade_day ? (
                            <span className="text-muted-foreground">-</span>
                          ) : trade.result_type === "TP" ? (
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
                          trade.no_trade_day ? "text-muted-foreground" : (trade.result_dollars || 0) >= 0 ? "text-success" : "text-destructive"
                        )}>
                          {trade.no_trade_day ? "-" : `$${(trade.result_dollars || 0).toFixed(2)}`}
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
