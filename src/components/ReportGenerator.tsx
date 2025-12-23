import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Trade {
  id: string;
  date: string;
  day_of_week: string;
  week_of_month: number | null;
  entry_time: string | null;
  exit_time: string | null;
  trade_type: string | null;
  result_type: string | null;
  drawdown?: number | null;
  max_rr?: number | null;
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
    const winRate = actualTrades.length > 0 ? (winningTrades.length / actualTrades.length * 100) : 0;
    
    const avgWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0) / winningTrades.length 
      : 0;
    const avgLoss = losingTrades.length > 0 
      ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0) / losingTrades.length)
      : 0;
    const expectedValue = avgWin * (winRate / 100) - avgLoss * (1 - winRate / 100);

    // Calculate streaks
    let currentTPStreak = 0;
    let bestTPStreak = 0;
    let currentSLStreak = 0;
    let worstSLStreak = 0;

    actualTrades.forEach(trade => {
      if (trade.result_type === "TP") {
        currentTPStreak++;
        currentSLStreak = 0;
        if (currentTPStreak > bestTPStreak) bestTPStreak = currentTPStreak;
      } else if (trade.result_type === "SL") {
        currentSLStreak++;
        currentTPStreak = 0;
        if (currentSLStreak > worstSLStreak) worstSLStreak = currentSLStreak;
      } else {
        currentTPStreak = 0;
        currentSLStreak = 0;
      }
    });

    // By entry model
    const modelStats = ["M1", "M3", "Continuación"].map(model => {
      const modelTrades = actualTrades.filter(t => t.entry_model === model);
      const modelWins = modelTrades.filter(t => t.result_type === "TP");
      const modelPnL = modelTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0);
      const modelWinRate = modelTrades.length > 0 ? (modelWins.length / modelTrades.length * 100) : 0;
      return { model, trades: modelTrades.length, pnl: modelPnL, winRate: modelWinRate };
    });

    // By day of week
    const dayStats = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map(day => {
      const dayTrades = actualTrades.filter(t => t.day_of_week?.toLowerCase() === day.toLowerCase());
      const dayWins = dayTrades.filter(t => t.result_type === "TP");
      const dayPnL = dayTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0);
      const dayWinRate = dayTrades.length > 0 ? (dayWins.length / dayTrades.length * 100) : 0;
      return { day, trades: dayTrades.length, pnl: dayPnL, winRate: dayWinRate };
    });

    // By week of month
    const weekStats = [1, 2, 3, 4, 5].map(week => {
      const weekTrades = actualTrades.filter(t => t.week_of_month === week);
      const weekWins = weekTrades.filter(t => t.result_type === "TP");
      const weekPnL = weekTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0);
      const weekWinRate = weekTrades.length > 0 ? (weekWins.length / weekTrades.length * 100) : 0;
      return { week, trades: weekTrades.length, pnl: weekPnL, winRate: weekWinRate };
    });

    // News analysis
    const tradesWithNews = actualTrades.filter(t => t.had_news);
    const tradesWithoutNews = actualTrades.filter(t => !t.had_news);
    const newsWins = tradesWithNews.filter(t => t.result_type === "TP");
    const noNewsWins = tradesWithoutNews.filter(t => t.result_type === "TP");
    const newsPnL = tradesWithNews.reduce((sum, t) => sum + (t.result_dollars || 0), 0);
    const noNewsPnL = tradesWithoutNews.reduce((sum, t) => sum + (t.result_dollars || 0), 0);
    const newsWinRate = tradesWithNews.length > 0 ? (newsWins.length / tradesWithNews.length * 100) : 0;
    const noNewsWinRate = tradesWithoutNews.length > 0 ? (noNewsWins.length / tradesWithoutNews.length * 100) : 0;

    // Trade type analysis
    const buyTrades = actualTrades.filter(t => t.trade_type?.toLowerCase() === "compra" || t.trade_type?.toLowerCase() === "buy" || t.trade_type?.toLowerCase() === "long");
    const sellTrades = actualTrades.filter(t => t.trade_type?.toLowerCase() === "venta" || t.trade_type?.toLowerCase() === "sell" || t.trade_type?.toLowerCase() === "short");
    const buyWins = buyTrades.filter(t => t.result_type === "TP");
    const sellWins = sellTrades.filter(t => t.result_type === "TP");
    const buyWinRate = buyTrades.length > 0 ? (buyWins.length / buyTrades.length * 100) : 0;
    const sellWinRate = sellTrades.length > 0 ? (sellWins.length / sellTrades.length * 100) : 0;

    // Execution rate
    const totalDays = trades.length;
    const executionRate = totalDays > 0 ? (actualTrades.length / totalDays * 100) : 0;

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const primaryColor: [number, number, number] = [41, 98, 255];
    const successColor: [number, number, number] = [34, 197, 94];
    const dangerColor: [number, number, number] = [239, 68, 68];
    const grayColor: [number, number, number] = [100, 116, 139];
    
    let yPos = 20;

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("INFORME DE TRADING", pageWidth / 2, 18, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("EdgeCore Trading Journal", pageWidth / 2, 28, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, pageWidth / 2, 36, { align: "center" });

    yPos = 55;

    // Summary Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Resumen General", 14, yPos);
    yPos += 10;

    // Summary boxes
    const boxWidth = 42;
    const boxHeight = 28;
    const boxGap = 4;
    const startX = 14;

    // Box 1: Total P&L
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(startX, yPos, boxWidth, boxHeight, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text("P&L TOTAL", startX + boxWidth/2, yPos + 8, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(totalPnL >= 0 ? successColor[0] : dangerColor[0], totalPnL >= 0 ? successColor[1] : dangerColor[1], totalPnL >= 0 ? successColor[2] : dangerColor[2]);
    doc.text(`$${totalPnL.toFixed(2)}`, startX + boxWidth/2, yPos + 20, { align: "center" });

    // Box 2: Win Rate
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(startX + boxWidth + boxGap, yPos, boxWidth, boxHeight, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text("WIN RATE", startX + boxWidth + boxGap + boxWidth/2, yPos + 8, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(winRate >= 50 ? successColor[0] : dangerColor[0], winRate >= 50 ? successColor[1] : dangerColor[1], winRate >= 50 ? successColor[2] : dangerColor[2]);
    doc.text(`${winRate.toFixed(1)}%`, startX + boxWidth + boxGap + boxWidth/2, yPos + 20, { align: "center" });

    // Box 3: Total Trades
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(startX + 2*(boxWidth + boxGap), yPos, boxWidth, boxHeight, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text("OPERACIONES", startX + 2*(boxWidth + boxGap) + boxWidth/2, yPos + 8, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(`${actualTrades.length}`, startX + 2*(boxWidth + boxGap) + boxWidth/2, yPos + 20, { align: "center" });

    // Box 4: Expected Value
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(startX + 3*(boxWidth + boxGap), yPos, boxWidth, boxHeight, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text("EXPECTATIVA", startX + 3*(boxWidth + boxGap) + boxWidth/2, yPos + 8, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(expectedValue >= 0 ? successColor[0] : dangerColor[0], expectedValue >= 0 ? successColor[1] : dangerColor[1], expectedValue >= 0 ? successColor[2] : dangerColor[2]);
    doc.text(`$${expectedValue.toFixed(2)}`, startX + 3*(boxWidth + boxGap) + boxWidth/2, yPos + 20, { align: "center" });

    yPos += boxHeight + 10;

    // Second row of boxes
    // Box 5: Best Streak
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(startX, yPos, boxWidth, boxHeight, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text("MEJOR RACHA", startX + boxWidth/2, yPos + 8, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...successColor);
    doc.text(`${bestTPStreak} TPs`, startX + boxWidth/2, yPos + 20, { align: "center" });

    // Box 6: Worst Streak
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(startX + boxWidth + boxGap, yPos, boxWidth, boxHeight, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text("PEOR RACHA", startX + boxWidth + boxGap + boxWidth/2, yPos + 8, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...dangerColor);
    doc.text(`${worstSLStreak} SLs`, startX + boxWidth + boxGap + boxWidth/2, yPos + 20, { align: "center" });

    // Box 7: Avg Win
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(startX + 2*(boxWidth + boxGap), yPos, boxWidth, boxHeight, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text("PROM. GANANCIA", startX + 2*(boxWidth + boxGap) + boxWidth/2, yPos + 8, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...successColor);
    doc.text(`$${avgWin.toFixed(2)}`, startX + 2*(boxWidth + boxGap) + boxWidth/2, yPos + 20, { align: "center" });

    // Box 8: Avg Loss
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(startX + 3*(boxWidth + boxGap), yPos, boxWidth, boxHeight, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text("PROM. PÉRDIDA", startX + 3*(boxWidth + boxGap) + boxWidth/2, yPos + 8, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...dangerColor);
    doc.text(`$${avgLoss.toFixed(2)}`, startX + 3*(boxWidth + boxGap) + boxWidth/2, yPos + 20, { align: "center" });

    yPos += boxHeight + 15;

    // Model Analysis Table
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Análisis por Modelo de Entrada", 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Modelo', 'Operaciones', 'P&L', 'Win Rate']],
      body: modelStats.map(m => [
        m.model,
        m.trades.toString(),
        `$${m.pnl.toFixed(2)}`,
        `${m.winRate.toFixed(1)}%`
      ]),
      theme: 'striped',
      headStyles: { 
        fillColor: primaryColor,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;

    // Day Analysis Table
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Análisis por Día de la Semana", 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Día', 'Operaciones', 'P&L', 'Win Rate']],
      body: dayStats.map(d => [
        d.day,
        d.trades.toString(),
        `$${d.pnl.toFixed(2)}`,
        `${d.winRate.toFixed(1)}%`
      ]),
      theme: 'striped',
      headStyles: { 
        fillColor: primaryColor,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;

    // Week Analysis Table
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Análisis por Semana del Mes", 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Semana', 'Operaciones', 'P&L', 'Win Rate']],
      body: weekStats.map(w => [
        `Semana ${w.week}`,
        w.trades.toString(),
        `$${w.pnl.toFixed(2)}`,
        `${w.winRate.toFixed(1)}%`
      ]),
      theme: 'striped',
      headStyles: { 
        fillColor: primaryColor,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    });

    // New page for additional analysis
    doc.addPage();
    yPos = 20;

    // Trade Type Analysis
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Análisis por Tipo de Operación", 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Tipo', 'Operaciones', 'Ganadas', 'Win Rate']],
      body: [
        ['Compra (Long)', buyTrades.length.toString(), buyWins.length.toString(), `${buyWinRate.toFixed(1)}%`],
        ['Venta (Short)', sellTrades.length.toString(), sellWins.length.toString(), `${sellWinRate.toFixed(1)}%`]
      ],
      theme: 'striped',
      headStyles: { 
        fillColor: primaryColor,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        3: { halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;

    // News Analysis
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Análisis de Impacto de Noticias", 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Condición', 'Operaciones', 'P&L', 'Win Rate']],
      body: [
        ['Con Noticias', tradesWithNews.length.toString(), `$${newsPnL.toFixed(2)}`, `${newsWinRate.toFixed(1)}%`],
        ['Sin Noticias', tradesWithoutNews.length.toString(), `$${noNewsPnL.toFixed(2)}`, `${noNewsWinRate.toFixed(1)}%`]
      ],
      theme: 'striped',
      headStyles: { 
        fillColor: primaryColor,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;

    // Execution Statistics
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Estadísticas de Ejecución", 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total de Días Registrados', totalDays.toString()],
        ['Días con Operación', actualTrades.length.toString()],
        ['Días sin Entrada', noTradeDays.length.toString()],
        ['Tasa de Ejecución', `${executionRate.toFixed(1)}%`]
      ],
      theme: 'striped',
      headStyles: { 
        fillColor: primaryColor,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        1: { halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Trade Details Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Detalle de Operaciones", 14, yPos);
    yPos += 5;

    // Trade Details Table
    autoTable(doc, {
      startY: yPos,
      head: [['Fecha', 'Día', 'Hora', 'Tipo', 'Modelo', 'Resultado', 'P&L']],
      body: actualTrades.map(trade => [
        trade.date,
        trade.day_of_week || 'N/A',
        trade.entry_time || 'N/A',
        trade.trade_type || 'N/A',
        trade.entry_model || 'N/A',
        trade.result_type || 'N/A',
        `$${(trade.result_dollars || 0).toFixed(2)}`
      ]),
      theme: 'striped',
      headStyles: { 
        fillColor: primaryColor,
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        6: { halign: 'right' }
      },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          if (data.cell.raw === 'TP') {
            data.cell.styles.textColor = successColor;
            data.cell.styles.fontStyle = 'bold';
          } else if (data.cell.raw === 'SL') {
            data.cell.styles.textColor = dangerColor;
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    // Footer on all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(...grayColor);
      doc.text(
        `Página ${i} de ${pageCount} | EdgeCore Trading Journal`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Save PDF
    doc.save(`informe-trading-edgecore-${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("Informe PDF descargado exitosamente");
  };

  return (
    <Button onClick={generateReport} variant="outline" className="gap-2">
      <Download className="h-4 w-4" />
      Descargar Informe PDF
    </Button>
  );
};
