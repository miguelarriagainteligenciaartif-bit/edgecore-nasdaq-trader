import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
}

export const StatsCard = ({ title, value, icon: Icon, trend = "neutral", subtitle }: StatsCardProps) => {
  return (
    <Card className="overflow-hidden border-border hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
              {title}
            </p>
            <h3 className={cn(
              "text-xl font-bold font-serif tracking-tight truncate",
              trend === "up" && "text-success",
              trend === "down" && "text-destructive",
              trend === "neutral" && "text-foreground"
            )}>
              {value}
            </h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={cn(
            "p-2.5 rounded-lg shrink-0",
            trend === "up" && "bg-success/10",
            trend === "down" && "bg-destructive/10",
            trend === "neutral" && "bg-secondary"
          )}>
            <Icon className={cn(
              "h-4 w-4",
              trend === "up" && "text-success",
              trend === "down" && "text-destructive",
              trend === "neutral" && "text-muted-foreground"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
