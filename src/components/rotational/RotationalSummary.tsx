import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Percent, DollarSign, Target } from "lucide-react";
import { RotationalState } from "@/utils/rotationalSimulator";
import { cn } from "@/lib/utils";

interface RotationalSummaryProps {
  state: RotationalState;
  initialBalances: number[];
}

export const RotationalSummary = ({
  state,
  initialBalances,
}: RotationalSummaryProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const totalInitialCapital = initialBalances.reduce((sum, bal) => sum + bal, 0);
  const totalPnL = state.totalBalance - totalInitialCapital;
  const roi = totalInitialCapital > 0 ? (totalPnL / totalInitialCapital) * 100 : 0;

  const stats = [
    {
      label: "Balance Total",
      value: formatCurrency(state.totalBalance),
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "P&L Total",
      value: formatCurrency(totalPnL),
      subValue: formatPercent(roi) + " ROI",
      icon: TrendingUp,
      color: totalPnL >= 0 ? "text-accent" : "text-destructive",
      bgColor: totalPnL >= 0 ? "bg-accent/10" : "bg-destructive/10",
    },
    {
      label: "Win Rate",
      value: formatPercent(state.winRate),
      subValue: `${state.totalTP}W / ${state.totalSL}L`,
      icon: Percent,
      color: state.winRate >= 50 ? "text-accent" : "text-warning",
      bgColor: state.winRate >= 50 ? "bg-accent/10" : "bg-warning/10",
    },
    {
      label: "Total Trades",
      value: state.trades.length.toString(),
      icon: Target,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className={cn("text-xl font-bold", stat.color)}>{stat.value}</p>
                {stat.subValue && (
                  <p className="text-xs text-muted-foreground">{stat.subValue}</p>
                )}
              </div>
              <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
