import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Database, TrendingUp, TrendingDown, Play, Calendar, Filter, CheckSquare, ClipboardPaste } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RotationalTradeResult } from "@/utils/rotationalSimulator";
import { toast } from "sonner";

export interface RealTrade {
  id: string;
  date: string;
  result_type: string;
  result_dollars: number;
  entry_model: string;
  trade_type: string;
}

interface TradeSelectorProps {
  onTradesSelected: (trades: RotationalTradeResult[]) => void;
  isSimulationActive: boolean;
}

export const TradeSelector = ({ onTradesSelected, isSimulationActive }: TradeSelectorProps) => {
  const [trades, setTrades] = useState<RealTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTradeIds, setSelectedTradeIds] = useState<Set<string>>(new Set());
  const [filterModel, setFilterModel] = useState<string>("all");
  const [filterResult, setFilterResult] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectCount, setSelectCount] = useState<number>(10);
  const [pastedSequence, setPastedSequence] = useState<string>("");

  useEffect(() => {
    loadTrades();
  }, []);

  const loadTrades = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("trades")
        .select("id, date, result_type, result_dollars, entry_model, trade_type")
        .eq("no_trade_day", false)
        .in("result_type", ["TP", "SL"])
        .order("date", { ascending: true })
        .order("entry_time", { ascending: true });

      if (error) throw error;
      setTrades(data || []);
    } catch (error) {
      console.error("Error loading trades:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrades = trades.filter((trade) => {
    if (filterModel !== "all" && trade.entry_model !== filterModel) return false;
    if (filterResult !== "all" && trade.result_type !== filterResult) return false;
    if (dateFrom && trade.date < dateFrom) return false;
    if (dateTo && trade.date > dateTo) return false;
    return true;
  });

  const handleToggleTrade = (tradeId: string) => {
    const newSelected = new Set(selectedTradeIds);
    if (newSelected.has(tradeId)) {
      newSelected.delete(tradeId);
    } else {
      newSelected.add(tradeId);
    }
    setSelectedTradeIds(newSelected);
  };

  const handleSelectFirst = (count: number) => {
    const newSelected = new Set<string>();
    filteredTrades.slice(0, count).forEach((trade) => {
      newSelected.add(trade.id);
    });
    setSelectedTradeIds(newSelected);
  };

  const handleSelectAll = () => {
    const newSelected = new Set<string>();
    filteredTrades.forEach((trade) => {
      newSelected.add(trade.id);
    });
    setSelectedTradeIds(newSelected);
  };

  const handleClearSelection = () => {
    setSelectedTradeIds(new Set());
  };

  const handleStartWithTrades = () => {
    // Get selected trades maintaining the original order from filteredTrades
    const selectedTrades = filteredTrades
      .filter((trade) => selectedTradeIds.has(trade.id))
      .map((trade) => trade.result_type as RotationalTradeResult);

    onTradesSelected(selectedTrades);
  };

  const parsePastedSequence = (text: string): RotationalTradeResult[] | null => {
    // Clean the input: remove extra spaces, convert to uppercase
    const cleaned = text.trim().toUpperCase();
    
    // Try different separators: comma, space, newline, semicolon
    let parts: string[] = [];
    if (cleaned.includes(",")) {
      parts = cleaned.split(",").map(s => s.trim());
    } else if (cleaned.includes(";")) {
      parts = cleaned.split(";").map(s => s.trim());
    } else if (cleaned.includes("\n")) {
      parts = cleaned.split("\n").map(s => s.trim());
    } else if (cleaned.includes(" ")) {
      parts = cleaned.split(/\s+/);
    } else {
      // Maybe it's something like "TPSLTP" or "WWLWL"
      // Try to parse as consecutive TP/SL or W/L
      const matches = cleaned.match(/(TP|SL|W|L)/g);
      if (matches) {
        parts = matches;
      }
    }

    // Filter out empty strings and validate
    const validResults: RotationalTradeResult[] = [];
    for (const part of parts) {
      if (part === "TP" || part === "W" || part === "WIN" || part === "1") {
        validResults.push("TP");
      } else if (part === "SL" || part === "L" || part === "LOSS" || part === "0") {
        validResults.push("SL");
      } else if (part !== "") {
        // Invalid entry found
        return null;
      }
    }

    return validResults.length > 0 ? validResults : null;
  };

  const handleStartWithPasted = () => {
    const results = parsePastedSequence(pastedSequence);
    if (!results) {
      toast.error("Formato inválido. Usa: TP,SL,TP o TP SL TP o W,L,W");
      return;
    }
    if (results.length === 0) {
      toast.error("No se encontraron trades válidos");
      return;
    }
    toast.success(`Iniciando simulación con ${results.length} trades`);
    onTradesSelected(results);
  };

  const pastedStats = (() => {
    const results = parsePastedSequence(pastedSequence);
    if (!results) return { total: 0, tp: 0, sl: 0, winRate: "0" };
    const tp = results.filter(r => r === "TP").length;
    const sl = results.filter(r => r === "SL").length;
    return {
      total: results.length,
      tp,
      sl,
      winRate: results.length > 0 ? ((tp / results.length) * 100).toFixed(1) : "0"
    };
  })();

  const selectedStats = {
    total: selectedTradeIds.size,
    tp: filteredTrades.filter((t) => selectedTradeIds.has(t.id) && t.result_type === "TP").length,
    sl: filteredTrades.filter((t) => selectedTradeIds.has(t.id) && t.result_type === "SL").length,
  };

  const winRate = selectedStats.total > 0 ? ((selectedStats.tp / selectedStats.total) * 100).toFixed(1) : "0";

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Seleccionar Trades</CardTitle>
            <CardDescription>
              Usa tus trades registrados o pega una secuencia personalizada
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="database" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="database" className="gap-2">
              <Database className="h-4 w-4" />
              Desde Dashboard
            </TabsTrigger>
            <TabsTrigger value="paste" className="gap-2">
              <ClipboardPaste className="h-4 w-4" />
              Pegar Secuencia
            </TabsTrigger>
          </TabsList>

          <TabsContent value="database" className="mt-4 space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Filter className="h-3 w-3" /> Modelo
                </Label>
                <Select value={filterModel} onValueChange={setFilterModel}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="M1">M1</SelectItem>
                    <SelectItem value="M3">M3</SelectItem>
                    <SelectItem value="Continuación">Continuación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Resultado</Label>
                <Select value={filterResult} onValueChange={setFilterResult}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="TP">Solo TP</SelectItem>
                    <SelectItem value="SL">Solo SL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Desde
                </Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Hasta</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Quick selection */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={filteredTrades.length}
                  value={selectCount}
                  onChange={(e) => setSelectCount(Math.min(Number(e.target.value), filteredTrades.length))}
                  className="h-8 w-20 text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectFirst(selectCount)}
                  disabled={loading || filteredTrades.length === 0}
                >
                  <CheckSquare className="h-3 w-3 mr-1" />
                  Seleccionar primeros
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={handleSelectAll} disabled={loading}>
                Seleccionar todos ({filteredTrades.length})
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClearSelection} disabled={selectedTradeIds.size === 0}>
                Limpiar
              </Button>
            </div>

            {/* Trades list */}
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Cargando trades...</div>
            ) : filteredTrades.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay trades que coincidan con los filtros
              </div>
            ) : (
              <ScrollArea className="h-[280px] rounded-md border border-border/50 p-2">
                <div className="space-y-1">
                  {filteredTrades.map((trade, index) => (
                    <div
                      key={trade.id}
                      onClick={() => handleToggleTrade(trade.id)}
                      className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                        selectedTradeIds.has(trade.id)
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedTradeIds.has(trade.id)}
                          onCheckedChange={() => handleToggleTrade(trade.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-xs text-muted-foreground w-6">#{index + 1}</span>
                        <span className="text-sm font-mono">{trade.date}</span>
                        <Badge variant="outline" className="text-xs">
                          {trade.entry_model}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {trade.result_type === "TP" ? (
                          <div className="flex items-center gap-1 text-success">
                            <TrendingUp className="h-3 w-3" />
                            <span className="text-sm font-medium">TP</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-destructive">
                            <TrendingDown className="h-3 w-3" />
                            <span className="text-sm font-medium">SL</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Selection summary and action */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  Seleccionados: <span className="font-medium text-foreground">{selectedStats.total}</span>
                </span>
                <span className="text-success">
                  TP: {selectedStats.tp}
                </span>
                <span className="text-destructive">
                  SL: {selectedStats.sl}
                </span>
                <span className="text-muted-foreground">
                  Win Rate: <span className="font-medium text-foreground">{winRate}%</span>
                </span>
              </div>
              <Button
                onClick={handleStartWithTrades}
                disabled={selectedTradeIds.size === 0 || isSimulationActive}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Simular con {selectedStats.total} trades
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="paste" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Pegar secuencia de trades</Label>
              <Textarea
                placeholder="Pega tu secuencia aquí. Ejemplos:
TP, SL, TP, TP, SL
TP SL TP TP SL  
W, L, W, W, L
1, 0, 1, 1, 0"
                value={pastedSequence}
                onChange={(e) => setPastedSequence(e.target.value)}
                className="min-h-[150px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Formatos soportados: TP/SL, W/L, WIN/LOSS, 1/0. Separadores: coma, espacio, línea nueva, punto y coma.
              </p>
            </div>

            {pastedSequence.trim() && (
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Detectados: <span className="font-medium text-foreground">{pastedStats.total}</span>
                  </span>
                  <span className="text-success">
                    TP: {pastedStats.tp}
                  </span>
                  <span className="text-destructive">
                    SL: {pastedStats.sl}
                  </span>
                  <span className="text-muted-foreground">
                    Win Rate: <span className="font-medium text-foreground">{pastedStats.winRate}%</span>
                  </span>
                </div>
                <Button
                  onClick={handleStartWithPasted}
                  disabled={pastedStats.total === 0 || isSimulationActive}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Simular con {pastedStats.total} trades
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
