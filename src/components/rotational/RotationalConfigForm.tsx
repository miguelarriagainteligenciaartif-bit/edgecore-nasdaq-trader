import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings, Play, Wallet } from "lucide-react";
import { RotationalConfig } from "@/utils/rotationalSimulator";

interface RotationalConfigFormProps {
  config: RotationalConfig;
  onConfigChange: (config: RotationalConfig) => void;
  onStart: () => void;
  isSimulationActive: boolean;
}

export const RotationalConfigForm = ({
  config,
  onConfigChange,
  onStart,
  isSimulationActive,
}: RotationalConfigFormProps) => {
  const handleChange = (field: keyof RotationalConfig, value: number | number[]) => {
    onConfigChange({ ...config, [field]: value });
  };

  const handleNumberOfAccountsChange = (newCount: number) => {
    const validCount = Math.max(2, Math.min(20, newCount));
    const currentBalances = config.initialBalances;
    
    // Ajustar el array de balances al nuevo número de cuentas
    let newBalances: number[];
    if (validCount > currentBalances.length) {
      // Agregar nuevas cuentas con el último balance conocido o 50000 por defecto
      const defaultBalance = currentBalances[currentBalances.length - 1] || 50000;
      newBalances = [
        ...currentBalances,
        ...Array(validCount - currentBalances.length).fill(defaultBalance)
      ];
    } else {
      // Reducir el número de cuentas
      newBalances = currentBalances.slice(0, validCount);
    }
    
    onConfigChange({
      ...config,
      numberOfAccounts: validCount,
      initialBalances: newBalances,
    });
  };

  const handleBalanceChange = (index: number, value: number) => {
    const newBalances = [...config.initialBalances];
    newBalances[index] = value;
    handleChange("initialBalances", newBalances);
  };

  const totalInitialCapital = config.initialBalances.reduce((sum, bal) => sum + bal, 0);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="h-5 w-5 text-primary" />
          Configuración de Simulación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="numberOfAccounts">
              Número de Cuentas (N)
            </Label>
            <Input
              id="numberOfAccounts"
              type="number"
              min={2}
              max={20}
              value={config.numberOfAccounts}
              onChange={(e) => handleNumberOfAccountsChange(parseInt(e.target.value) || 2)}
              disabled={isSimulationActive}
              className="bg-secondary/50"
            />
            <p className="text-xs text-muted-foreground">
              Cantidad de cuentas en rotación (mín. 2)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="riskPerTrade">
              Riesgo por Trade ($)
            </Label>
            <Input
              id="riskPerTrade"
              type="number"
              min={1}
              step={10}
              value={config.riskPerTrade}
              onChange={(e) => handleChange("riskPerTrade", parseFloat(e.target.value) || 100)}
              disabled={isSimulationActive}
              className="bg-secondary/50"
            />
            <p className="text-xs text-muted-foreground">
              Monto arriesgado por operación
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="riskRewardRatio">
              Ratio R:R (1:X)
            </Label>
            <Input
              id="riskRewardRatio"
              type="number"
              min={0.5}
              max={10}
              step={0.5}
              value={config.riskRewardRatio}
              onChange={(e) => handleChange("riskRewardRatio", parseFloat(e.target.value) || 1)}
              disabled={isSimulationActive}
              className="bg-secondary/50"
            />
            <p className="text-xs text-muted-foreground">
              Ej: 2 = Ganar $2 por cada $1 arriesgado
            </p>
          </div>
        </div>

        {/* Balances individuales por cuenta */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Balance Inicial por Cuenta
            </Label>
            <span className="text-sm text-muted-foreground">
              Total: <span className="text-primary font-medium">${totalInitialCapital.toLocaleString()}</span>
            </span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {config.initialBalances.map((balance, index) => (
              <div key={index} className="space-y-1">
                <Label htmlFor={`balance-${index}`} className="text-xs text-muted-foreground">
                  Cuenta {index + 1}
                </Label>
                <Input
                  id={`balance-${index}`}
                  type="number"
                  min={0}
                  step={100}
                  value={balance}
                  onChange={(e) => handleBalanceChange(index, parseFloat(e.target.value) || 0)}
                  disabled={isSimulationActive}
                  className="bg-secondary/50 text-sm"
                  placeholder="$0"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Define el balance actual de cada cuenta
          </p>
        </div>

        {!isSimulationActive && (
          <Button onClick={onStart} className="w-full" size="lg">
            <Play className="h-5 w-5 mr-2" />
            Iniciar Simulación
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
