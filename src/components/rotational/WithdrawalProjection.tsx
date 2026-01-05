import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  Calendar,
  TrendingUp,
  Wallet,
  Play
} from "lucide-react";
import { 
  GroupRotationalState, 
  projectWithdrawals,
  ProjectedWithdrawal
} from "@/utils/groupRotationalSimulator";

interface WithdrawalProjectionProps {
  state: GroupRotationalState;
}

export const WithdrawalProjection = ({ state }: WithdrawalProjectionProps) => {
  const [expectedWinRate, setExpectedWinRate] = useState(state.winRate || 55);
  const [tradesToProject, setTradesToProject] = useState(100);
  const [projections, setProjections] = useState<ProjectedWithdrawal[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  const runProjection = () => {
    setIsCalculating(true);
    // Simular async para UX
    setTimeout(() => {
      const results = projectWithdrawals(state, expectedWinRate, tradesToProject);
      setProjections(results);
      setIsCalculating(false);
    }, 100);
  };

  const totalProjectedWithdrawals = projections.reduce((sum, p) => sum + p.withdrawalAmount, 0);

  // Agrupar proyecciones por grupo
  const projectionsByGroup = projections.reduce((acc, p) => {
    if (!acc[p.groupName]) {
      acc[p.groupName] = [];
    }
    acc[p.groupName].push(p);
    return acc;
  }, {} as { [key: string]: ProjectedWithdrawal[] });

  return (
    <Card className="bg-card/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          Proyección de Retiros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Parámetros de proyección */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-secondary/30 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="expectedWinRate" className="text-xs">
              Win Rate Esperado (%)
            </Label>
            <Input
              id="expectedWinRate"
              type="number"
              min={1}
              max={99}
              value={expectedWinRate}
              onChange={(e) => setExpectedWinRate(parseFloat(e.target.value) || 50)}
              className="h-8"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tradesToProject" className="text-xs">
              Trades a Proyectar
            </Label>
            <Input
              id="tradesToProject"
              type="number"
              min={10}
              max={500}
              step={10}
              value={tradesToProject}
              onChange={(e) => setTradesToProject(parseInt(e.target.value) || 100)}
              className="h-8"
            />
          </div>

          <div className="flex items-end">
            <Button 
              onClick={runProjection} 
              disabled={isCalculating}
              className="w-full h-8"
            >
              <Play className="h-4 w-4 mr-1" />
              {isCalculating ? 'Calculando...' : 'Proyectar'}
            </Button>
          </div>
        </div>

        {/* Resultados */}
        {projections.length > 0 && (
          <>
            {/* Resumen */}
            <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-500" />
                <span className="font-medium">Total Proyectado</span>
              </div>
              <span className="text-xl font-bold text-emerald-500">
                ${totalProjectedWithdrawals.toLocaleString()}
              </span>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              {projections.length} retiros proyectados en {tradesToProject} trades con {expectedWinRate}% win rate
            </div>

            {/* Proyecciones por grupo */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {Object.entries(projectionsByGroup).map(([groupName, groupProjections]) => {
                const groupTotal = groupProjections.reduce((sum, p) => sum + p.withdrawalAmount, 0);
                
                return (
                  <div key={groupName} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{groupName}</span>
                      <Badge variant="outline" className="text-xs">
                        {groupProjections.length} retiros · ${groupTotal.toLocaleString()}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      {groupProjections.slice(0, 5).map((projection, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center justify-between text-xs bg-secondary/30 p-2 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span>Trade #{projection.projectedTradeNumber}</span>
                            <span className="text-muted-foreground">
                              {projection.accountName}
                            </span>
                          </div>
                          <span className="text-emerald-500 font-medium">
                            +${projection.withdrawalAmount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                      {groupProjections.length > 5 && (
                        <div className="text-xs text-muted-foreground text-center py-1">
                          ... y {groupProjections.length - 5} retiros más
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {projections.length === 0 && (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Configura los parámetros y ejecuta la proyección</p>
            <p className="text-xs mt-1">
              Esto simulará {tradesToProject} trades con un {expectedWinRate}% de win rate
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
