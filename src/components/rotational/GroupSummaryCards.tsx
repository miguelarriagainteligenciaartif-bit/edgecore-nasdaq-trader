import { Card } from "@/components/ui/card";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  Target,
  CheckCircle2,
  Percent,
  BarChart3
} from "lucide-react";
import { GroupRotationalState } from "@/utils/groupRotationalSimulator";

interface GroupSummaryCardsProps {
  state: GroupRotationalState;
}

export const GroupSummaryCards = ({ state }: GroupSummaryCardsProps) => {
  // Calcular totales
  const totalBalance = state.groups.reduce((sum, g) => 
    sum + g.accounts.reduce((accSum, a) => accSum + a.currentBalance, 0), 0);
  
  const totalInitial = state.groups.reduce((sum, g) => 
    sum + g.accounts.reduce((accSum, a) => accSum + a.initialBalance, 0), 0);
  
  const totalPnL = totalBalance - totalInitial;
  const roi = totalInitial > 0 ? (totalPnL / totalInitial) * 100 : 0;

  const totalProfitInclWithdrawals = totalPnL + state.totalWithdrawn;
  const roiTotal = totalInitial > 0 ? (totalProfitInclWithdrawals / totalInitial) * 100 : 0;

  const stats = [
    {
      label: "Balance Total",
      value: `$${totalBalance.toLocaleString()}`,
      icon: Wallet,
      color: "text-primary",
    },
    {
      label: "P&L (actual)",
      value: `${totalPnL >= 0 ? '+' : ''}$${totalPnL.toLocaleString()}`,
      subValue: `Con retiros: ${totalProfitInclWithdrawals >= 0 ? '+' : ''}$${totalProfitInclWithdrawals.toLocaleString()}`,
      icon: totalPnL >= 0 ? TrendingUp : TrendingDown,
      color: totalPnL >= 0 ? "text-emerald-500" : "text-red-500",
    },
    {
      label: "ROI (actual)",
      value: `${roi >= 0 ? '+' : ''}${roi.toFixed(2)}%`,
      subValue: `Con retiros: ${roiTotal >= 0 ? '+' : ''}${roiTotal.toFixed(2)}%`,
      icon: Percent,
      color: roi >= 0 ? "text-emerald-500" : "text-red-500",
    },
    {
      label: "Win Rate",
      value: `${state.winRate.toFixed(1)}%`,
      icon: Target,
      color: state.winRate >= 50 ? "text-emerald-500" : "text-amber-500",
    },
    {
      label: "Trades",
      value: `${state.totalTP + state.totalSL}`,
      subValue: `${state.totalTP} TP / ${state.totalSL} SL`,
      icon: BarChart3,
      color: "text-blue-500",
    },
    {
      label: "Total Retirado",
      value: `$${state.totalWithdrawn.toLocaleString()}`,
      icon: CheckCircle2,
      color: "text-emerald-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((stat, idx) => (
        <Card key={idx} className="p-3 bg-card/50">
          <div className="flex items-center gap-2 mb-1">
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
          <div className={`text-lg font-bold ${stat.color}`}>
            {stat.value}
          </div>
          {stat.subValue && (
            <div className="text-xs text-muted-foreground">
              {stat.subValue}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
