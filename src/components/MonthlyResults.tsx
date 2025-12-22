import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Trade {
  id: string;
  date: string;
  result_dollars: number | null;
  no_trade_day: boolean;
  result_type: string | null;
}

interface MonthlyResultsProps {
  trades: Trade[];
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export function MonthlyResults({ trades }: MonthlyResultsProps) {
  const [selectedYear, setSelectedYear] = useState<string>("all");

  // Get all years from trades
  const years = useMemo(() => {
    const yearSet = new Set<number>();
    trades.forEach(trade => {
      if (trade.date) {
        // Parse date correctly - format is YYYY-MM-DD
        const dateParts = trade.date.split('-');
        if (dateParts.length === 3) {
          const year = parseInt(dateParts[0], 10);
          if (year >= 2020 && !isNaN(year)) yearSet.add(year);
        }
      }
    });
    return Array.from(yearSet).sort((a, b) => b - a); // Most recent first
  }, [trades]);

  // Calculate monthly results grouped by year
  const monthlyData = useMemo(() => {
    const actualTrades = trades.filter(t => !t.no_trade_day);
    const data: Record<number, Record<number, { pnl: number; trades: number; wins: number }>> = {};

    actualTrades.forEach(trade => {
      if (!trade.date) return;
      
      // Parse date correctly - format is YYYY-MM-DD
      const dateParts = trade.date.split('-');
      if (dateParts.length !== 3) return;
      
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // 0-indexed for consistency with MONTH_NAMES

      if (year < 2020 || isNaN(year) || isNaN(month)) return;

      if (!data[year]) data[year] = {};
      if (!data[year][month]) data[year][month] = { pnl: 0, trades: 0, wins: 0 };

      data[year][month].pnl += trade.result_dollars || 0;
      data[year][month].trades += 1;
      if (trade.result_type === "TP") data[year][month].wins += 1;
    });

    return data;
  }, [trades]);

  // Get years to display based on selection
  const displayYears = selectedYear === "all" ? years : [parseInt(selectedYear)];

  // Calculate yearly totals
  const yearlyTotals = useMemo(() => {
    const totals: Record<number, { pnl: number; trades: number; wins: number }> = {};
    
    Object.entries(monthlyData).forEach(([year, months]) => {
      const yearNum = parseInt(year);
      totals[yearNum] = { pnl: 0, trades: 0, wins: 0 };
      
      Object.values(months).forEach(monthData => {
        totals[yearNum].pnl += monthData.pnl;
        totals[yearNum].trades += monthData.trades;
        totals[yearNum].wins += monthData.wins;
      });
    });

    return totals;
  }, [monthlyData]);

  if (years.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Resultados Mensuales</CardTitle>
              <CardDescription>P&L desglosado por mes y año</CardDescription>
            </div>
          </div>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los años</SelectItem>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {displayYears.map(year => {
            const yearData = monthlyData[year] || {};
            const yearTotal = yearlyTotals[year] || { pnl: 0, trades: 0, wins: 0 };
            const winRate = yearTotal.trades > 0 ? (yearTotal.wins / yearTotal.trades * 100).toFixed(1) : "0";

            return (
              <div key={year} className="space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {year}
                    <Badge variant={yearTotal.pnl >= 0 ? "default" : "destructive"}>
                      {yearTotal.pnl >= 0 ? "+" : ""}{yearTotal.pnl.toFixed(2)}$
                    </Badge>
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {yearTotal.trades} ops · WR: {winRate}%
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mes</TableHead>
                        <TableHead className="text-center">Operaciones</TableHead>
                        <TableHead className="text-center">Win Rate</TableHead>
                        <TableHead className="text-right">P&L</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MONTH_NAMES.map((monthName, monthIndex) => {
                        const monthData = yearData[monthIndex];
                        if (!monthData) return null;

                        const monthWinRate = monthData.trades > 0 
                          ? (monthData.wins / monthData.trades * 100).toFixed(0) 
                          : "0";

                        return (
                          <TableRow key={monthIndex}>
                            <TableCell className="font-medium">{monthName}</TableCell>
                            <TableCell className="text-center">{monthData.trades}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className={cn(
                                parseFloat(monthWinRate) >= 50 ? "text-success" : "text-destructive"
                              )}>
                                {monthWinRate}%
                              </Badge>
                            </TableCell>
                            <TableCell className={cn(
                              "text-right font-mono font-semibold",
                              monthData.pnl >= 0 ? "text-success" : "text-destructive"
                            )}>
                              <div className="flex items-center justify-end gap-1">
                                {monthData.pnl >= 0 ? (
                                  <TrendingUp className="h-4 w-4" />
                                ) : (
                                  <TrendingDown className="h-4 w-4" />
                                )}
                                {monthData.pnl >= 0 ? "+" : ""}{monthData.pnl.toFixed(2)}$
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}