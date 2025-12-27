import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, ArrowRight } from "lucide-react";
import { RotationalState } from "@/utils/rotationalSimulator";
import { cn } from "@/lib/utils";

interface RotationalAccountsDisplayProps {
  state: RotationalState;
  initialBalances: number[];
}

export const RotationalAccountsDisplay = ({
  state,
  initialBalances,
}: RotationalAccountsDisplayProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getAccountStatus = (balance: number, initialBalance: number) => {
    const diff = balance - initialBalance;
    if (diff > 0) return "profit";
    if (diff < 0) return "loss";
    return "neutral";
  };

  const totalInitialCapital = initialBalances.reduce((sum, bal) => sum + bal, 0);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wallet className="h-5 w-5 text-primary" />
          Estado de Cuentas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {state.accounts.map((balance, index) => {
            const isCurrentTurn = index === state.currentTurnIndex;
            const initialBalance = initialBalances[index] || 0;
            const status = getAccountStatus(balance, initialBalance);
            const pnl = balance - initialBalance;

            return (
              <div
                key={index}
                className={cn(
                  "relative p-4 rounded-lg border transition-all duration-300",
                  isCurrentTurn
                    ? "border-primary bg-primary/10 ring-2 ring-primary/50"
                    : "border-border bg-secondary/30"
                )}
              >
                {isCurrentTurn && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5">
                      <ArrowRight className="h-3 w-3 mr-1" />
                      Turno
                    </Badge>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">
                    Cuenta {index + 1}
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {formatCurrency(balance)}
                  </p>
                  <p
                    className={cn(
                      "text-xs font-medium",
                      status === "profit" && "text-accent",
                      status === "loss" && "text-destructive",
                      status === "neutral" && "text-muted-foreground"
                    )}
                  >
                    {pnl >= 0 ? "+" : ""}
                    {formatCurrency(pnl)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 rounded-lg bg-secondary/50 border border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Balance Total</span>
            <span className="text-2xl font-bold text-foreground">
              {formatCurrency(state.totalBalance)}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              Capital Inicial Total: {formatCurrency(totalInitialCapital)}
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                state.totalBalance >= totalInitialCapital
                  ? "text-accent"
                  : "text-destructive"
              )}
            >
              {state.totalBalance >= totalInitialCapital ? "+" : ""}
              {formatCurrency(state.totalBalance - totalInitialCapital)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
