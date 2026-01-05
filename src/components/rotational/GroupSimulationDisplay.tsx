import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  TrendingUp, 
  TrendingDown,
  Wallet,
  Target,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { 
  GroupRotationalState,
  GroupConfig,
  BrokerType,
  getBrokerSummary
} from "@/utils/groupRotationalSimulator";

interface GroupSimulationDisplayProps {
  state: GroupRotationalState;
  onTradeResult: (brokerType: BrokerType, result: 'TP' | 'SL') => void;
}

export const GroupSimulationDisplay = ({ state, onTradeResult }: GroupSimulationDisplayProps) => {
  const brokerSummary = getBrokerSummary(state);
  const brokerTypes = [...new Set(state.groups.map(g => g.brokerType))];

  return (
    <div className="space-y-6">
      {/* Resumen por Broker */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(brokerSummary).map(([brokerName, summary]) => {
          const pnl = summary.totalBalance - summary.totalInitial;
          const pnlPercent = (pnl / summary.totalInitial) * 100;
          const isProfit = pnl >= 0;

          return (
            <Card key={brokerName} className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    {brokerName}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {summary.groups} grupos · {summary.accounts} cuentas
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Balance Total</span>
                  <span className="font-medium">${summary.totalBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">P&L</span>
                  <span className={`font-medium ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                    {isProfit ? '+' : ''}{pnl.toLocaleString()} ({pnlPercent.toFixed(2)}%)
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Retirado</span>
                  <span className="font-medium text-emerald-500">
                    ${summary.totalWithdrawn.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Controles de Trading por Broker */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {brokerTypes.map(brokerType => {
          const groupsOfType = state.groups.filter(g => g.brokerType === brokerType);
          const currentIndex = state.currentTurnByBroker[brokerType] || 0;
          const currentGroup = groupsOfType[currentIndex % groupsOfType.length];
          
          if (!currentGroup) return null;

          const colorClass = brokerType === 'cfd' ? 'border-blue-500' : 'border-amber-500';
          const bgClass = brokerType === 'cfd' ? 'bg-blue-500/10' : 'bg-amber-500/10';

          return (
            <Card key={brokerType} className={`border-2 ${colorClass}`}>
              <CardHeader className={`pb-3 ${bgClass}`}>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Siguiente Trade: {brokerType.toUpperCase()}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  <span className="font-medium">{currentGroup.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {currentGroup.accounts.length} cuentas
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  {currentGroup.accounts.map(account => (
                    <div key={account.id} className="flex justify-between">
                      <span>{account.name}</span>
                      <span>${account.currentBalance.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-16 border-emerald-500/50 hover:bg-emerald-500/20 hover:border-emerald-500"
                    onClick={() => onTradeResult(brokerType, 'TP')}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                      <span className="text-sm font-medium">TP</span>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-16 border-red-500/50 hover:bg-red-500/20 hover:border-red-500"
                    onClick={() => onTradeResult(brokerType, 'SL')}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <TrendingDown className="h-5 w-5 text-red-500" />
                      <span className="text-sm font-medium">SL</span>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Estado de Todos los Grupos */}
      <Card className="bg-card/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            Estado de Cuentas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {state.groups.map(group => {
              const groupsOfType = state.groups.filter(g => g.brokerType === group.brokerType);
              const currentIndex = state.currentTurnByBroker[group.brokerType] || 0;
              const isCurrentTurn = groupsOfType[currentIndex % groupsOfType.length]?.id === group.id;
              
              const colorClass = group.brokerType === 'cfd' ? 'border-blue-500/30' : 'border-amber-500/30';
              const bgClass = isCurrentTurn 
                ? (group.brokerType === 'cfd' ? 'bg-blue-500/10' : 'bg-amber-500/10')
                : '';

              return (
                <div 
                  key={group.id} 
                  className={`border rounded-lg p-3 ${colorClass} ${bgClass}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{group.name}</span>
                      {isCurrentTurn && (
                        <Badge className="text-xs bg-primary/20 text-primary">
                          Turno Actual
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {group.brokerName}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {group.accounts.map(account => {
                      const pnl = account.currentBalance - account.initialBalance;
                      const pnlPercent = (pnl / account.initialBalance) * 100;
                      const isProfit = pnl >= 0;
                      const hasWithdrawals = account.withdrawals.length > 0;
                      const targetReached = pnlPercent >= state.config.profitTargetPercent;

                      return (
                        <div 
                          key={account.id}
                          className={`p-2 rounded text-xs ${
                            isProfit ? 'bg-emerald-500/10' : 'bg-red-500/10'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium truncate">{account.name}</span>
                            {hasWithdrawals && (
                              <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="text-muted-foreground">
                            ${account.currentBalance.toLocaleString()}
                          </div>
                          <div className={isProfit ? 'text-emerald-500' : 'text-red-500'}>
                            {isProfit ? '+' : ''}{pnlPercent.toFixed(1)}%
                          </div>
                          {account.withdrawals.length > 0 && (
                            <div className="text-emerald-500 mt-1">
                              Retirado: ${account.withdrawals.reduce((s, w) => s + w.amount, 0).toLocaleString()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
