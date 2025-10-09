import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Trade {
  id: string;
  date: string;
  result_dollars: number | null;
  no_trade_day: boolean;
  account_id: string | null;
}

export default function EquityCurve() {
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
    loadData();
  };

  const loadData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .order("date", { ascending: true })
      .order("entry_time", { ascending: true });

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

  const CHART_COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  const equityCurveData = () => {
    if (selectedAccount !== "all") {
      const account = accounts.find(acc => acc.id === selectedAccount);
      const initialBalance = account ? Number(account.initial_balance) : 0;
      let cumulative = initialBalance;
      return actualTrades.map((trade, index) => {
        cumulative += (trade.result_dollars || 0);
        return {
          trade: index + 1,
          equity: cumulative,
          date: trade.date,
        };
      });
    }

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
    
    accounts.forEach(acc => {
      accountCumulatives[acc.id] = Number(acc.initial_balance);
    });
    
    let totalInitialBalance = accounts.reduce((sum, acc) => sum + Number(acc.initial_balance), 0);
    accountCumulatives["total"] = totalInitialBalance;

    return dates.map((date, index) => {
      const dayTrades = tradesByDate[date];
      const dataPoint: any = { trade: index + 1, date };

      dayTrades.forEach((trade: Trade) => {
        if (trade.account_id) {
          accountCumulatives[trade.account_id] += (trade.result_dollars || 0);
        } else {
          // Solo sumar al total si no tiene cuenta asignada
          accountCumulatives["total"] += (trade.result_dollars || 0);
        }
      });

      // Calcular el total como la suma de todas las cuentas
      let totalFromAccounts = 0;
      accounts.forEach(acc => {
        dataPoint[acc.id] = accountCumulatives[acc.id];
        totalFromAccounts += accountCumulatives[acc.id];
      });
      
      // Usar el total calculado de las cuentas más operaciones sin cuenta
      dataPoint["total"] = totalFromAccounts + (accountCumulatives["total"] - totalInitialBalance);

      return dataPoint;
    });
  };

  const equityCurve = equityCurveData();

  return (
    <div className="min-h-screen bg-background">
      <Header userName={user?.email} />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Curva de Capital</h2>
            <p className="text-muted-foreground mt-2">Visualización del progreso acumulado de tus operaciones</p>
          </div>
          
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
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-20">
              <p className="text-center text-muted-foreground">Cargando datos...</p>
            </CardContent>
          </Card>
        ) : equityCurve.length === 0 ? (
          <Card>
            <CardContent className="py-20">
              <p className="text-center text-muted-foreground">No hay operaciones registradas aún</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Evolución del Capital</CardTitle>
              <CardDescription>
                {selectedAccount === "all" 
                  ? "Progreso acumulado por cuenta y total agregado" 
                  : "Progreso acumulado de P&L"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={500}>
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
      </main>
    </div>
  );
}
