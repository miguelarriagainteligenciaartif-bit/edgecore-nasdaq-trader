import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { ChecklistData } from "../ChecklistWizard";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StepDailyProps {
  data: ChecklistData;
  updateData: (updates: Partial<ChecklistData>) => void;
}

export const StepDaily = ({ data, updateData }: StepDailyProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-base font-medium">
          ¿Cómo cerró el día de ayer?
        </Label>
        <RadioGroup
          value={data.daily_yesterday || ""}
          onValueChange={(value) => updateData({ daily_yesterday: value })}
          className="grid grid-cols-3 gap-4"
        >
          <div className="flex flex-col items-center p-4 rounded-lg border border-border hover:border-success cursor-pointer has-[:checked]:border-success has-[:checked]:bg-success/10">
            <RadioGroupItem value="bullish" id="daily-bullish" className="sr-only" />
            <Label htmlFor="daily-bullish" className="cursor-pointer flex flex-col items-center gap-2">
              <TrendingUp className="h-8 w-8 text-success" />
              <span>Alcista</span>
            </Label>
          </div>
          <div className="flex flex-col items-center p-4 rounded-lg border border-border hover:border-destructive cursor-pointer has-[:checked]:border-destructive has-[:checked]:bg-destructive/10">
            <RadioGroupItem value="bearish" id="daily-bearish" className="sr-only" />
            <Label htmlFor="daily-bearish" className="cursor-pointer flex flex-col items-center gap-2">
              <TrendingDown className="h-8 w-8 text-destructive" />
              <span>Bajista</span>
            </Label>
          </div>
          <div className="flex flex-col items-center p-4 rounded-lg border border-border hover:border-muted-foreground cursor-pointer has-[:checked]:border-muted-foreground has-[:checked]:bg-muted/50">
            <RadioGroupItem value="ranging" id="daily-ranging" className="sr-only" />
            <Label htmlFor="daily-ranging" className="cursor-pointer flex flex-col items-center gap-2">
              <Minus className="h-8 w-8 text-muted-foreground" />
              <span>Rango</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-medium">
          ¿Cuántos FVG identificados en diario?
        </Label>
        <Input
          type="number"
          min={0}
          max={20}
          placeholder="0"
          value={data.daily_fvg_count ?? ""}
          onChange={(e) => updateData({ daily_fvg_count: e.target.value ? parseInt(e.target.value) : null })}
          className="w-32"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-base font-medium">
          ¿Dónde está el precio actualmente?
        </Label>
        <RadioGroup
          value={data.daily_current_price_location || ""}
          onValueChange={(value) => updateData({ daily_current_price_location: value })}
          className="grid grid-cols-3 gap-4"
        >
          <div className="flex flex-col items-center p-4 rounded-lg border border-border hover:border-success cursor-pointer has-[:checked]:border-success has-[:checked]:bg-success/10">
            <RadioGroupItem value="premium" id="daily-premium" className="sr-only" />
            <Label htmlFor="daily-premium" className="cursor-pointer text-center">
              <span className="block font-bold">Premium</span>
              <span className="text-xs text-muted-foreground">Zona de venta</span>
            </Label>
          </div>
          <div className="flex flex-col items-center p-4 rounded-lg border border-border hover:border-primary cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/10">
            <RadioGroupItem value="equilibrium" id="daily-equilibrium" className="sr-only" />
            <Label htmlFor="daily-equilibrium" className="cursor-pointer text-center">
              <span className="block font-bold">Equilibrio</span>
              <span className="text-xs text-muted-foreground">50%</span>
            </Label>
          </div>
          <div className="flex flex-col items-center p-4 rounded-lg border border-border hover:border-destructive cursor-pointer has-[:checked]:border-destructive has-[:checked]:bg-destructive/10">
            <RadioGroupItem value="discount" id="daily-discount" className="sr-only" />
            <Label htmlFor="daily-discount" className="cursor-pointer text-center">
              <span className="block font-bold">Discount</span>
              <span className="text-xs text-muted-foreground">Zona de compra</span>
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
};
