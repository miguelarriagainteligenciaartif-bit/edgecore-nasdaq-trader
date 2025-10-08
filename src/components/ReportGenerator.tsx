import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface Trade {
  id: string;
  date: string;
  day_of_week: string;
  entry_time: string | null;
  exit_time: string | null;
  trade_type: string | null;
  result_type: string | null;
  entry_model: string | null;
  result_dollars: number | null;
  had_news: boolean;
  news_description: string | null;
  custom_news_description: string | null;
  news_time: string | null;
  execution_timing: string | null;
  no_trade_day: boolean;
  image_link: string | null;
}

interface ReportGeneratorProps {
  trades: Trade[];
}

export const ReportGenerator = ({ trades }: ReportGeneratorProps) => {
  const generateReport = () => {
    if (trades.length === 0) {
      toast.error("No hay datos para generar el informe");
      return;
    }

    // Filter out no-trade days for statistics
    const actualTrades = trades.filter(t => !t.no_trade_day);
    const noTradeDays = trades.filter(t => t.no_trade_day);

    // Calculate statistics
    const totalPnL = actualTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0);
    const winningTrades = actualTrades.filter(t => t.result_type === "TP");
    const losingTrades = actualTrades.filter(t => t.result_type === "SL");
    const winRate = actualTrades.length > 0 ? (winningTrades.length / actualTrades.length * 100).toFixed(2) : "0";
    
    // By entry model
    const m1Stats = {
      trades: actualTrades.filter(t => t.entry_model === "M1"),
      pnl: actualTrades.filter(t => t.entry_model === "M1").reduce((sum, t) => sum + (t.result_dollars || 0), 0)
    };
    const m3Stats = {
      trades: actualTrades.filter(t => t.entry_model === "M3"),
      pnl: actualTrades.filter(t => t.entry_model === "M3").reduce((sum, t) => sum + (t.result_dollars || 0), 0)
    };
    const contStats = {
      trades: actualTrades.filter(t => t.entry_model === "Continuación"),
      pnl: actualTrades.filter(t => t.entry_model === "Continuación").reduce((sum, t) => sum + (t.result_dollars || 0), 0)
    };

    // By day of week
    const dayStats = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map(day => ({
      day,
      trades: actualTrades.filter(t => t.day_of_week === day).length,
      pnl: actualTrades.filter(t => t.day_of_week === day).reduce((sum, t) => sum + (t.result_dollars || 0), 0)
    }));

    // News analysis
    const tradesWithNews = actualTrades.filter(t => t.had_news);

    // Execution rate
    const totalDays = trades.length;
    const executionRate = totalDays > 0 ? (actualTrades.length / totalDays * 100).toFixed(2) : "0";

    // Generate CSV content
    let csvContent = "INFORME COMPLETO DE TRADING - EDGECORE\n\n";
    csvContent += "=== RESUMEN GENERAL ===\n";
    csvContent += `Total Operaciones,${actualTrades.length}\n`;
    csvContent += `Días sin Entrada,${noTradeDays.length}\n`;
    csvContent += `Tasa de Ejecución,${executionRate}%\n`;
    csvContent += `P&L Total,$${totalPnL.toFixed(2)}\n`;
    csvContent += `Win Rate,${winRate}%\n`;
    csvContent += `Operaciones Ganadoras,${winningTrades.length}\n`;
    csvContent += `Operaciones Perdedoras,${losingTrades.length}\n\n`;

    csvContent += "=== ANÁLISIS POR MODELO DE ENTRADA ===\n";
    csvContent += `Modelo,Operaciones,P&L,Win Rate\n`;
    csvContent += `M1,${m1Stats.trades.length},$${m1Stats.pnl.toFixed(2)},${m1Stats.trades.length > 0 ? (m1Stats.trades.filter(t => t.result_type === "TP").length / m1Stats.trades.length * 100).toFixed(2) : 0}%\n`;
    csvContent += `M3,${m3Stats.trades.length},$${m3Stats.pnl.toFixed(2)},${m3Stats.trades.length > 0 ? (m3Stats.trades.filter(t => t.result_type === "TP").length / m3Stats.trades.length * 100).toFixed(2) : 0}%\n`;
    csvContent += `Continuación,${contStats.trades.length},$${contStats.pnl.toFixed(2)},${contStats.trades.length > 0 ? (contStats.trades.filter(t => t.result_type === "TP").length / contStats.trades.length * 100).toFixed(2) : 0}%\n\n`;

    csvContent += "=== ANÁLISIS POR DÍA DE LA SEMANA ===\n";
    csvContent += `Día,Operaciones,P&L\n`;
    dayStats.forEach(day => {
      csvContent += `${day.day},${day.trades},$${day.pnl.toFixed(2)}\n`;
    });
    csvContent += "\n";

    csvContent += "=== ANÁLISIS DE NOTICIAS ===\n";
    csvContent += `Operaciones con Noticias,${tradesWithNews.length}\n`;
    csvContent += `P&L con Noticias,$${tradesWithNews.reduce((sum, t) => sum + (t.result_dollars || 0), 0).toFixed(2)}\n\n`;

    csvContent += "=== DETALLE DE TODAS LAS OPERACIONES ===\n";
    csvContent += `Fecha,Día,Hora Entrada,Hora Salida,Tipo,Modelo,Resultado,P&L,Noticia,Descripción Noticia,Timing,Día Sin Entrada\n`;
    
    trades.forEach(trade => {
      const newsDesc = trade.news_description === "Otra" ? trade.custom_news_description : trade.news_description;
      csvContent += `${trade.date},${trade.day_of_week},${trade.entry_time || "N/A"},${trade.exit_time || "N/A"},${trade.trade_type || "N/A"},${trade.entry_model || "N/A"},${trade.result_type || "N/A"},$${(trade.result_dollars || 0).toFixed(2)},${trade.had_news ? "Sí" : "No"},${newsDesc || "N/A"},${trade.execution_timing || "N/A"},${trade.no_trade_day ? "Sí" : "No"}\n`;
    });

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `informe-trading-edgecore-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Informe descargado exitosamente");
  };

  return (
    <Button onClick={generateReport} variant="outline" className="gap-2">
      <Download className="h-4 w-4" />
      Descargar Informe Completo
    </Button>
  );
};
