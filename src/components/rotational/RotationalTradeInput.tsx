import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Undo2, RotateCcw } from "lucide-react";
import { RotationalState } from "@/utils/rotationalSimulator";

interface RotationalTradeInputProps {
  state: RotationalState;
  onTradeResult: (result: 'TP' | 'SL') => void;
  onUndo: () => void;
  onReset: () => void;
}

export const RotationalTradeInput = ({
  state,
  onTradeResult,
  onUndo,
  onReset,
}: RotationalTradeInputProps) => {
  const nextAccountNumber = state.currentTurnIndex + 1;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>Registrar Trade</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
              disabled={state.trades.length === 0}
            >
              <Undo2 className="h-4 w-4 mr-1" />
              Deshacer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              disabled={state.trades.length === 0}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reiniciar
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-2">
            Próxima cuenta en recibir el resultado:
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30">
            <span className="text-2xl font-bold text-primary">
              Cuenta {nextAccountNumber}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            size="lg"
            className="h-20 text-lg bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={() => onTradeResult('TP')}
          >
            <TrendingUp className="h-6 w-6 mr-2" />
            Registrar TP
          </Button>
          <Button
            size="lg"
            variant="destructive"
            className="h-20 text-lg"
            onClick={() => onTradeResult('SL')}
          >
            <TrendingDown className="h-6 w-6 mr-2" />
            Registrar SL
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{state.trades.length}</p>
            <p className="text-xs text-muted-foreground">Total Trades</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-accent">{state.totalTP}</p>
            <p className="text-xs text-muted-foreground">Take Profits</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-destructive">{state.totalSL}</p>
            <p className="text-xs text-muted-foreground">Stop Losses</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
