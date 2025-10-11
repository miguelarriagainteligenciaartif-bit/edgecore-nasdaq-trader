import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TradeResult } from "@/utils/flipX5Simulator";
import { Plus, TrendingUp, TrendingDown, X, Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface FlipTradeInputProps {
  trades: TradeResult[];
  onTradesChange: (trades: TradeResult[]) => void;
}

export const FlipTradeInput = ({ trades, onTradesChange }: FlipTradeInputProps) => {
  const [bulkInput, setBulkInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const addTrade = (result: TradeResult) => {
    onTradesChange([...trades, result]);
  };

  const removeTrade = (index: number) => {
    onTradesChange(trades.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    onTradesChange([]);
    setBulkInput("");
  };

  const handleBulkAdd = () => {
    const input = bulkInput.toUpperCase().trim();
    const results = input.split(/[\s,;]+/).filter(t => t === 'TP' || t === 'SL') as TradeResult[];
    if (results.length > 0) {
      onTradesChange([...trades, ...results]);
      setBulkInput("");
      setIsEditing(false);
    }
  };

  const tpCount = trades.filter(t => t === 'TP').length;
  const slCount = trades.filter(t => t === 'SL').length;
  const winRate = trades.length > 0 ? ((tpCount / trades.length) * 100).toFixed(1) : "0";

  return (
    <Card className="p-6 bg-card/30 border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Resultados de Trades</h3>
          <p className="text-sm text-muted-foreground">
            Total: {trades.length} | TP: <span className="text-success">{tpCount}</span> | 
            SL: <span className="text-destructive">{slCount}</span> | 
            Win Rate: <span className="text-primary">{winRate}%</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Entrada Masiva
          </Button>
          {trades.length > 0 && (
            <Button variant="destructive" size="sm" onClick={clearAll}>
              Limpiar Todo
            </Button>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="mb-4 space-y-2">
          <Input
            placeholder="Ingresa: TP SL TP SL (separados por espacio, coma o ;)"
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleBulkAdd();
              }
            }}
          />
          <Button onClick={handleBulkAdd} size="sm" className="w-full">
            Agregar Trades
          </Button>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <Button
          onClick={() => addTrade('TP')}
          variant="outline"
          className="flex-1 border-success/50 hover:bg-success/10"
        >
          <TrendingUp className="h-4 w-4 mr-2 text-success" />
          TP
        </Button>
        <Button
          onClick={() => addTrade('SL')}
          variant="outline"
          className="flex-1 border-destructive/50 hover:bg-destructive/10"
        >
          <TrendingDown className="h-4 w-4 mr-2 text-destructive" />
          SL
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 min-h-[100px] p-4 bg-background/50 rounded-lg border border-border/30">
        {trades.length === 0 ? (
          <div className="w-full text-center py-8 text-muted-foreground">
            <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Agrega resultados de trades</p>
            <p className="text-xs">TP para ganancias, SL para pérdidas</p>
          </div>
        ) : (
          trades.map((trade, index) => (
            <Badge
              key={index}
              variant={trade === 'TP' ? 'default' : 'destructive'}
              className="text-sm px-3 py-1 flex items-center gap-2 cursor-pointer group"
              onClick={() => removeTrade(index)}
            >
              {trade === 'TP' ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {index + 1}. {trade}
              <X className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Badge>
          ))
        )}
      </div>
    </Card>
  );
};
