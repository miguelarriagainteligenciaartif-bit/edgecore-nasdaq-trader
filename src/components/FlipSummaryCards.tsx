import { Card } from "@/components/ui/card";
import { SimulationResult } from "@/utils/flipX5Simulator";
import { TrendingUp, DollarSign, Percent, Target } from "lucide-react";

interface FlipSummaryCardsProps {
  result: SimulationResult;
  accountSize: number;
}

export const FlipSummaryCards = ({ result, accountSize }: FlipSummaryCardsProps) => {
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatPercent = (value: number) => `${value.toFixed(2)}%`;

  const difference = result.finalBalanceLeveraged - result.finalBalanceTraditional;
  const differencePercent = ((difference / result.finalBalanceTraditional) * 100);

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Tradicional */}
      <Card className="p-6 bg-card/30 border-border/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Balance Tradicional</span>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold mb-1">
          {formatCurrency(result.finalBalanceTraditional)}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={result.totalProfitTraditional >= 0 ? "text-success" : "text-destructive"}>
            {result.totalProfitTraditional >= 0 ? "+" : ""}{formatCurrency(result.totalProfitTraditional)}
          </span>
          <span className="text-muted-foreground">
            ({formatPercent(result.roiTraditional)})
          </span>
        </div>
      </Card>

      {/* Apalancado */}
      <Card className="p-6 bg-card/30 border-primary/20 border-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-primary font-medium">Balance Apalancado</span>
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <div className="text-2xl font-bold text-primary mb-1">
          {formatCurrency(result.finalBalanceLeveraged)}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={result.totalProfitLeveraged >= 0 ? "text-success" : "text-destructive"}>
            {result.totalProfitLeveraged >= 0 ? "+" : ""}{formatCurrency(result.totalProfitLeveraged)}
          </span>
          <span className="text-muted-foreground">
            ({formatPercent(result.roiLeveraged)})
          </span>
        </div>
      </Card>

      {/* Diferencia */}
      <Card className="p-6 bg-card/30 border-border/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Diferencia</span>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className={`text-2xl font-bold mb-1 ${difference >= 0 ? 'text-success' : 'text-destructive'}`}>
          {formatCurrency(Math.abs(difference))}
        </div>
        <div className="text-xs text-muted-foreground">
          {differencePercent >= 0 ? "+" : ""}{formatPercent(differencePercent)} vs Tradicional
        </div>
      </Card>

      {/* Win Rate */}
      <Card className="p-6 bg-card/30 border-border/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Win Rate</span>
          <Target className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold mb-1">
          {formatPercent(result.winRate)}
        </div>
        <div className="text-xs text-muted-foreground">
          {result.totalTP} TP / {result.totalSL} SL
        </div>
      </Card>
    </div>
  );
};
