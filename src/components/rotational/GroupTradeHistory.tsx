import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, TrendingUp, TrendingDown } from "lucide-react";
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
            {trades.length} operaciones
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {[...trades].reverse().map((trade) => {
              const isTP = trade.result === 'TP';
              
              return (
                <div
                  key={trade.tradeNumber}
                  className={`p-4 rounded-lg border ${
                    isTP ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'
                  }`}
                >
                  {/* Trade Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`text-sm font-bold ${isTP ? 'border-emerald-500 text-emerald-500' : 'border-red-500 text-red-500'}`}
                      >
                        Trade #{trade.tradeNumber}
                      </Badge>
                      <Badge variant={isTP ? "default" : "destructive"} className="text-xs">
                        {isTP ? 'TP' : 'SL'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {isTP ? (
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      )}
                      <span className={`text-lg font-bold ${isTP ? 'text-emerald-500' : 'text-red-500'}`}>
                        {isTP ? '+' : ''}{trade.totalProfitLoss.toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Effects by Group */}
                  <div className="space-y-2">
                    {trade.effects.map((effect) => {
                      const colorClass = effect.brokerType === 'cfd' 
                        ? 'border-blue-500/30 bg-blue-500/5' 
                        : 'border-amber-500/30 bg-amber-500/5';
                      const dotColor = effect.brokerType === 'cfd' ? 'bg-blue-500' : 'bg-amber-500';
                      
                      return (
                        <div key={effect.groupId} className={`p-2 rounded border ${colorClass}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                            <span className="text-sm font-medium">{effect.groupName}</span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              Riesgo: ${effect.riskAmount}
                            </span>
                            <span className={`text-sm font-medium ${isTP ? 'text-emerald-500' : 'text-red-500'}`}>
                              {isTP ? '+' : ''}{effect.profitLoss.toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                            {effect.accountsAffected.map((account) => (
                              <div key={account.accountId} className="bg-background/50 p-1.5 rounded text-xs">
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
                        </div>
                      );
                    })}
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
