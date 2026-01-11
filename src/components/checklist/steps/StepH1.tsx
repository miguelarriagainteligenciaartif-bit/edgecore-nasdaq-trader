import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { ChecklistData } from "../ChecklistWizard";
import { TrendingUp, TrendingDown, Minus, Target } from "lucide-react";

interface StepH1Props {
  data: ChecklistData;
  updateData: (updates: Partial<ChecklistData>) => void;
}

export const StepH1 = ({ data, updateData }: StepH1Props) => {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-base font-medium">
          ¿Cuál es el contexto en 1H?
        </Label>
        <RadioGroup
          value={data.h1_context || ""}
          onValueChange={(value) => updateData({ h1_context: value })}
          className="grid grid-cols-3 gap-4"
        >
          <div className="flex flex-col items-center p-4 rounded-lg border border-border hover:border-success cursor-pointer has-[:checked]:border-success has-[:checked]:bg-success/10">
            <RadioGroupItem value="bullish" id="h1-bullish" className="sr-only" />
            <Label htmlFor="h1-bullish" className="cursor-pointer flex flex-col items-center gap-2">
              <TrendingUp className="h-8 w-8 text-success" />
              <span>Alcista</span>
            </Label>
          </div>
          <div className="flex flex-col items-center p-4 rounded-lg border border-border hover:border-destructive cursor-pointer has-[:checked]:border-destructive has-[:checked]:bg-destructive/10">
            <RadioGroupItem value="bearish" id="h1-bearish" className="sr-only" />
            <Label htmlFor="h1-bearish" className="cursor-pointer flex flex-col items-center gap-2">
              <TrendingDown className="h-8 w-8 text-destructive" />
              <span>Bajista</span>
            </Label>
          </div>
          <div className="flex flex-col items-center p-4 rounded-lg border border-border hover:border-muted-foreground cursor-pointer has-[:checked]:border-muted-foreground has-[:checked]:bg-muted/50">
            <RadioGroupItem value="ranging" id="h1-ranging" className="sr-only" />
            <Label htmlFor="h1-ranging" className="cursor-pointer flex flex-col items-center gap-2">
              <Minus className="h-8 w-8 text-muted-foreground" />
              <span>Rango</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-medium">
          ¿Cuántos FVG identificados en 1H?
        </Label>
        <Input
          type="number"
          min={0}
          max={20}
          placeholder="0"
          value={data.h1_fvg_count ?? ""}
          onChange={(e) => updateData({ h1_fvg_count: e.target.value ? parseInt(e.target.value) : null })}
          className="w-32"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-base font-medium">
          ¿Has identificado un POI (Point of Interest) claro?
        </Label>
        <RadioGroup
          value={data.h1_poi_identified === null ? "" : data.h1_poi_identified ? "yes" : "no"}
          onValueChange={(value) => updateData({ h1_poi_identified: value === "yes" })}
          className="flex gap-4"
        >
          <div className="flex flex-col items-center p-4 rounded-lg border border-border hover:border-success cursor-pointer has-[:checked]:border-success has-[:checked]:bg-success/10 flex-1">
            <RadioGroupItem value="yes" id="poi-yes" className="sr-only" />
            <Label htmlFor="poi-yes" className="cursor-pointer flex flex-col items-center gap-2">
              <Target className="h-8 w-8 text-success" />
              <span>Sí, POI identificado</span>
            </Label>
          </div>
          <div className="flex flex-col items-center p-4 rounded-lg border border-border hover:border-destructive cursor-pointer has-[:checked]:border-destructive has-[:checked]:bg-destructive/10 flex-1">
            <RadioGroupItem value="no" id="poi-no" className="sr-only" />
            <Label htmlFor="poi-no" className="cursor-pointer flex flex-col items-center gap-2">
              <Minus className="h-8 w-8 text-destructive" />
              <span>No, sin POI claro</span>
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
};
