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
  CheckCircle2,
  Clock,
  Info
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  GroupRotationalState,
  getBrokerSummary
} from "@/utils/groupRotationalSimulator";

interface GroupSimulationDisplayProps {
  state: GroupRotationalState;
  onTradeResult: (result: 'TP' | 'SL') => void;
}

export const GroupSimulationDisplay = ({ state, onTradeResult }: GroupSimulationDisplayProps) => {
  const brokerSummary = getBrokerSummary(state);
  const cfdGroups = state.groups.filter(g => g.brokerType === 'cfd');
  const futuresGroups = state.groups.filter(g => g.brokerType === 'futures');
  
  // Get current turn for each broker type
  const cfdCurrentIndex = state.currentTurnByBroker['cfd'] || 0;
  const futuresCurrentIndex = state.currentTurnByBroker['futures'] || 0;
  const currentCfdGroup = cfdGroups[cfdCurrentIndex % cfdGroups.length];
  const currentFuturesGroup = futuresGroups[futuresCurrentIndex % futuresGroups.length];

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
                  <span className="text-muted-foreground">P&L (actual)</span>
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
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Profit total</span>
                  <span className="font-medium">
                    ${(pnl + summary.totalWithdrawn).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Control de Trading UNIFICADO - Un trade aplica a CFD y Futuros */}
      <Card className="border-2 border-primary/50">
        <CardHeader className="pb-3 bg-primary/10">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4" />
            Siguiente Trade (aplica a CFD + Futuros)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {/* Show which groups will be affected */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {/* CFD Turn */}
            {currentCfdGroup && (
              <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="font-medium">CFD: {currentCfdGroup.name}</span>
                  <Badge variant="outline" className="text-xs ml-auto">
                    ${currentCfdGroup.riskPerTrade}/trade
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {currentCfdGroup.accounts.slice(0, 3).map(account => (
                    <div key={account.id} className="flex justify-between">
                      <span>{account.name}</span>
                      <span>${account.currentBalance.toLocaleString()}</span>
                    </div>
                  ))}
                  {currentCfdGroup.accounts.length > 3 && (
                    <div className="text-muted-foreground">
                      +{currentCfdGroup.accounts.length - 3} más...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Futures Turn */}
            {currentFuturesGroup && (
              <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="font-medium">Futuros: {currentFuturesGroup.name}</span>
                  <Badge variant="outline" className="text-xs ml-auto">
                    ${currentFuturesGroup.riskPerTrade}/trade
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {currentFuturesGroup.accounts.slice(0, 3).map(account => (
                    <div key={account.id} className="flex justify-between">
                      <span>{account.name}</span>
                      <span>${account.currentBalance.toLocaleString()}</span>
                    </div>
                  ))}
                  {currentFuturesGroup.accounts.length > 3 && (
                    <div className="text-muted-foreground">
                      +{currentFuturesGroup.accounts.length - 3} más...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Unified TP/SL Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-20 border-emerald-500/50 hover:bg-emerald-500/20 hover:border-emerald-500"
              onClick={() => onTradeResult('TP')}
            >
              <div className="flex flex-col items-center gap-1">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
                <span className="text-lg font-bold">TP</span>
                <span className="text-xs text-muted-foreground">Take Profit</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-20 border-red-500/50 hover:bg-red-500/20 hover:border-red-500"
              onClick={() => onTradeResult('SL')}
            >
              <div className="flex flex-col items-center gap-1">
                <TrendingDown className="h-6 w-6 text-red-500" />
                <span className="text-lg font-bold">SL</span>
                <span className="text-xs text-muted-foreground">Stop Loss</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

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
                    <TooltipProvider>
                      {group.accounts.map(account => {
                        const pnl = account.currentBalance - account.initialBalance;
                        const pnlPercent = (pnl / account.initialBalance) * 100;
                        const isProfit = pnl >= 0;
                        const hasWithdrawals = account.withdrawals.length > 0;
                        const targetReached = pnlPercent >= state.config.profitTargetPercent;
                        
                        // Apex withdrawal info
                        const isFutures = group.brokerType === 'futures';
                        const MIN_TRADES_FOR_WITHDRAWAL = 8;
                        // Ensure we have a valid number, default to 0
                        const tradesForWithdrawal = typeof account.tradesSinceLastWithdrawal === 'number' 
                          ? account.tradesSinceLastWithdrawal 
                          : 0;
                        const tradesRemaining = Math.max(0, MIN_TRADES_FOR_WITHDRAWAL - tradesForWithdrawal);
                        const canWithdraw = tradesRemaining === 0;
                        const withdrawalThreshold = group.withdrawalThreshold || (account.initialBalance + 4100);
                        const atThreshold = account.currentBalance >= withdrawalThreshold;

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
                            
                            {/* Indicador de días para retiro - Solo Apex/Futures */}
                            {isFutures && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className={`mt-1 flex items-center gap-1 ${
                                    canWithdraw && atThreshold 
                                      ? 'text-emerald-500' 
                                      : canWithdraw 
                                        ? 'text-blue-400' 
                                        : 'text-amber-500'
                                  }`}>
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      {canWithdraw 
                                        ? atThreshold 
                                          ? '¡Listo!' 
                                          : `${tradesForWithdrawal}/8 ✓`
                                        : `${tradesForWithdrawal}/8`
                                      }
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <div className="text-xs space-y-1">
                                    <p className="font-medium">Reglas de retiro Apex:</p>
                                    <p>• Mínimo 8 días de trading: {tradesForWithdrawal}/8 {canWithdraw ? '✓' : `(faltan ${tradesRemaining})`}</p>
                                    <p>• Umbral: ${withdrawalThreshold.toLocaleString()} {atThreshold ? '✓' : `(faltan $${(withdrawalThreshold - account.currentBalance).toLocaleString()})`}</p>
                                    <p>• Retiro: ${group.withdrawalAmount?.toLocaleString() || '2,000'}</p>
                                    {canWithdraw && atThreshold && (
                                      <p className="text-emerald-500 font-medium">¡Puede retirar en el próximo TP!</p>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            
                            {account.withdrawals.length > 0 && (
                              <div className="text-emerald-500 mt-1">
                                Retirado: ${account.withdrawals.reduce((s, w) => s + w.amount, 0).toLocaleString()}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </TooltipProvider>
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
