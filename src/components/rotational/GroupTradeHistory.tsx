import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, TrendingUp, TrendingDown, Layers } from "lucide-react";
import { GroupTrade } from "@/utils/groupRotationalSimulator";

interface GroupTradeHistoryProps {
  trades: GroupTrade[];
}

export const GroupTradeHistory = ({ trades }: GroupTradeHistoryProps) => {
  if (trades.length === 0) {
    return (
      <Card className="bg-card/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Historial de Trades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground text-sm">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No hay trades registrados</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Historial de Trades
          </span>
          <Badge variant="outline" className="text-xs">
            {trades.length} trades
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {[...trades].reverse().map((trade) => {
              const isTP = trade.result === 'TP';
              
              return (
                <div
                  key={trade.tradeNumber}
                  className={`p-3 rounded-lg border ${
                    isTP ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${isTP ? 'border-emerald-500 text-emerald-500' : 'border-red-500 text-red-500'}`}
                      >
                        #{trade.tradeNumber}
                      </Badge>
                      <span className="flex items-center gap-1 text-sm font-medium">
                        <Layers className="h-3 w-3" />
                        {trade.groupName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isTP ? (
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`font-bold ${isTP ? 'text-emerald-500' : 'text-red-500'}`}>
                        {isTP ? '+' : ''}{trade.profitLoss.toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
                    {trade.accountsAffected.map((account) => (
                      <div key={account.accountId} className="bg-background/50 p-2 rounded">
                        <div className="text-muted-foreground truncate">{account.accountName}</div>
                        <div className="flex items-center gap-1">
                          <span>${account.balanceBefore.toLocaleString()}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className={isTP ? 'text-emerald-500' : 'text-red-500'}>
                            ${account.balanceAfter.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-muted-foreground mt-2">
                    {trade.timestamp.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
