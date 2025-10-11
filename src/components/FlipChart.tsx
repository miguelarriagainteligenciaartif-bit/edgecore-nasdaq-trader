import { Card } from "@/components/ui/card";
import { SimulationResult } from "@/utils/flipX5Simulator";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface FlipChartProps {
  result: SimulationResult;
}

export const FlipChart = ({ result }: FlipChartProps) => {
  const chartData = result.trades.map((trade) => ({
    trade: trade.tradeNumber,
    Tradicional: trade.balanceTraditional,
    Apalancado: trade.balanceLeveraged,
  }));

  const formatCurrency = (value: number) => `$${value.toFixed(0)}`;

  return (
    <Card className="p-6 bg-card/30 border-border/50">
      <h3 className="text-lg font-semibold mb-4">Evolución del Balance</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="trade"
            stroke="hsl(var(--muted-foreground))"
            label={{ value: "Trade #", position: "insideBottom", offset: -5 }}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            tickFormatter={formatCurrency}
            label={{ value: "Balance ($)", angle: -90, position: "insideLeft" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
            formatter={(value: number) => formatCurrency(value)}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="Tradicional"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--muted-foreground))", r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="Apalancado"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            dot={{ fill: "hsl(var(--primary))", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
