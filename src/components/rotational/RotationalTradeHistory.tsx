import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { History, TrendingUp, TrendingDown } from "lucide-react";
import { RotationalTrade } from "@/utils/rotationalSimulator";
import { cn } from "@/lib/utils";

interface RotationalTradeHistoryProps {
  trades: RotationalTrade[];
}

export const RotationalTradeHistory = ({ trades }: RotationalTradeHistoryProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const reversedTrades = [...trades].reverse();

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-primary" />
          Historial de Trades
        </CardTitle>
      </CardHeader>
      <CardContent>
        {trades.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay trades registrados aún</p>
            <p className="text-sm mt-1">Los trades aparecerán aquí cuando los registres</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Balance Antes</TableHead>
                  <TableHead className="text-right">Balance Después</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reversedTrades.map((trade) => (
                  <TableRow key={trade.tradeNumber}>
                    <TableCell className="font-medium">
                      {trade.tradeNumber}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        Cuenta {trade.accountIndex + 1}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {trade.result === "TP" ? (
                          <>
                            <TrendingUp className="h-4 w-4 text-accent" />
                            <span className="text-accent font-medium">TP</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-4 w-4 text-destructive" />
                            <span className="text-destructive font-medium">SL</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium",
                        trade.amount >= 0 ? "text-accent" : "text-destructive"
                      )}
                    >
                      {trade.amount >= 0 ? "+" : ""}
                      {formatCurrency(trade.amount)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(trade.balanceBefore)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(trade.balanceAfter)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
