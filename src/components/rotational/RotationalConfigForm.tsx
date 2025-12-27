import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings, Play } from "lucide-react";
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
  const handleChange = (field: keyof RotationalConfig, value: number) => {
    onConfigChange({ ...config, [field]: value });
  };

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
              onChange={(e) => handleChange("numberOfAccounts", parseInt(e.target.value) || 2)}
              disabled={isSimulationActive}
              className="bg-secondary/50"
            />
            <p className="text-xs text-muted-foreground">
              Cantidad de cuentas en rotación (mín. 2)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialCapitalPerAccount">
              Capital Inicial por Cuenta ($)
            </Label>
            <Input
              id="initialCapitalPerAccount"
              type="number"
              min={100}
              step={100}
              value={config.initialCapitalPerAccount}
              onChange={(e) => handleChange("initialCapitalPerAccount", parseFloat(e.target.value) || 1000)}
              disabled={isSimulationActive}
              className="bg-secondary/50"
            />
            <p className="text-xs text-muted-foreground">
              Monto inicial de cada cuenta
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="riskPerTrade">
              Riesgo/Ganancia por Trade ($)
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
              Monto fijo ganado (TP) o perdido (SL) - R/R 1:1
            </p>
          </div>
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
