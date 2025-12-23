import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Download, Calendar } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { format, parseISO, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { es } from "date-fns/locale";

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

interface ReportGeneratorDialogProps {
  trades: Trade[];
}

type PresetPeriod = "all" | "thisMonth" | "lastMonth" | "thisYear" | "custom";

export const ReportGeneratorDialog = ({ trades }: ReportGeneratorDialogProps) => {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<PresetPeriod>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const today = new Date();
  
  const presetDates = useMemo(() => {
    const now = new Date();
    return {
      thisMonth: {
        start: format(startOfMonth(now), "yyyy-MM-dd"),
        end: format(endOfMonth(now), "yyyy-MM-dd"),
      },
      lastMonth: {
        start: format(startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1)), "yyyy-MM-dd"),
        end: format(endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1)), "yyyy-MM-dd"),
      },
      thisYear: {
        start: format(startOfYear(now), "yyyy-MM-dd"),
        end: format(endOfYear(now), "yyyy-MM-dd"),
      },
    };
  }, []);

  const handlePresetChange = (newPreset: PresetPeriod) => {
    setPreset(newPreset);
    if (newPreset === "thisMonth") {
      setStartDate(presetDates.thisMonth.start);
      setEndDate(presetDates.thisMonth.end);
    } else if (newPreset === "lastMonth") {
      setStartDate(presetDates.lastMonth.start);
      setEndDate(presetDates.lastMonth.end);
    } else if (newPreset === "thisYear") {
      setStartDate(presetDates.thisYear.start);
      setEndDate(presetDates.thisYear.end);
    } else if (newPreset === "all") {
      setStartDate("");
      setEndDate("");
    }
  };

  const filteredTrades = useMemo(() => {
    if (preset === "all" || (!startDate && !endDate)) {
      return trades;
    }
    return trades.filter(trade => {
      const tradeDate = trade.date;
      if (startDate && tradeDate < startDate) return false;
      if (endDate && tradeDate > endDate) return false;
      return true;
    });
  }, [trades, preset, startDate, endDate]);

  const generateReport = () => {
    if (filteredTrades.length === 0) {
      toast.error("No hay datos para generar el informe en el período seleccionado");
      return;
    }

    const actualTrades = filteredTrades.filter(t => !t.no_trade_day);
    const noTradeDays = filteredTrades.filter(t => t.no_trade_day);

    // Sort trades chronologically
    const sortedActualTrades = [...actualTrades].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      const timeCompare = (a.entry_time || "").localeCompare(b.entry_time || "");
      if (timeCompare !== 0) return timeCompare;
      return a.id.localeCompare(b.id);
    });

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

    sortedActualTrades.forEach(trade => {
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

    // Calculate equity curve data
    const equityCurveData: { trade: number; equity: number; date: string }[] = [];
    let cumulative = 0;
    sortedActualTrades.forEach((trade, index) => {
      cumulative += (trade.result_dollars || 0);
      equityCurveData.push({
        trade: index + 1,
        equity: cumulative,
        date: trade.date,
      });
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
    const totalDays = filteredTrades.length;
    const executionRate = totalDays > 0 ? (actualTrades.length / totalDays * 100) : 0;

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const primaryColor: [number, number, number] = [41, 98, 255];
    const successColor: [number, number, number] = [34, 197, 94];
    const dangerColor: [number, number, number] = [239, 68, 68];
    const grayColor: [number, number, number] = [100, 116, 139];
    
    let yPos = 20;

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("INFORME DE TRADING", pageWidth / 2, 18, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("EdgeCore Trading Journal", pageWidth / 2, 28, { align: "center" });
    
    // Period info
    doc.setFontSize(10);
    let periodText = "";
    if (preset === "all") {
      periodText = "Período: Todos los datos";
    } else {
      const startFormatted = startDate ? format(parseISO(startDate), "d MMM yyyy", { locale: es }) : "";
      const endFormatted = endDate ? format(parseISO(endDate), "d MMM yyyy", { locale: es }) : "";
      periodText = `Período: ${startFormatted} - ${endFormatted}`;
    }
    doc.text(periodText, pageWidth / 2, 36, { align: "center" });
    
    doc.setFontSize(9);
    doc.text(`Generado: ${format(new Date(), "d MMMM yyyy, HH:mm", { locale: es })}`, pageWidth / 2, 43, { align: "center" });

    yPos = 60;

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
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(startX, yPos, boxWidth, boxHeight, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text("MEJOR RACHA", startX + boxWidth/2, yPos + 8, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...successColor);
    doc.text(`${bestTPStreak} TPs`, startX + boxWidth/2, yPos + 20, { align: "center" });

    doc.setFillColor(245, 247, 250);
    doc.roundedRect(startX + boxWidth + boxGap, yPos, boxWidth, boxHeight, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text("PEOR RACHA", startX + boxWidth + boxGap + boxWidth/2, yPos + 8, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...dangerColor);
    doc.text(`${worstSLStreak} SLs`, startX + boxWidth + boxGap + boxWidth/2, yPos + 20, { align: "center" });

    doc.setFillColor(245, 247, 250);
    doc.roundedRect(startX + 2*(boxWidth + boxGap), yPos, boxWidth, boxHeight, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text("PROM. GANANCIA", startX + 2*(boxWidth + boxGap) + boxWidth/2, yPos + 8, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...successColor);
    doc.text(`$${avgWin.toFixed(2)}`, startX + 2*(boxWidth + boxGap) + boxWidth/2, yPos + 20, { align: "center" });

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

    // EQUITY CURVE CHART
    if (equityCurveData.length > 1) {
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Curva de Equity", 14, yPos);
      yPos += 8;

      const chartX = 20;
      const chartY = yPos;
      const chartWidth = pageWidth - 40;
      const chartHeight = 50;

      // Draw chart background
      doc.setFillColor(250, 250, 252);
      doc.roundedRect(chartX - 5, chartY - 5, chartWidth + 10, chartHeight + 15, 3, 3, 'F');

      // Calculate min/max for scaling
      const values = equityCurveData.map(d => d.equity);
      const minValue = Math.min(0, ...values);
      const maxValue = Math.max(0, ...values);
      const range = maxValue - minValue || 1;
      const padding = range * 0.1;
      const scaledMin = minValue - padding;
      const scaledMax = maxValue + padding;
      const scaledRange = scaledMax - scaledMin;

      // Draw zero line if applicable
      if (minValue < 0 && maxValue > 0) {
        const zeroY = chartY + chartHeight - ((0 - scaledMin) / scaledRange) * chartHeight;
        doc.setDrawColor(180, 180, 180);
        doc.setLineDashPattern([2, 2], 0);
        doc.line(chartX, zeroY, chartX + chartWidth, zeroY);
        doc.setLineDashPattern([], 0);
      }

      // Draw the equity line
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.8);
      
      const points: { x: number; y: number }[] = equityCurveData.map((d, i) => ({
        x: chartX + (i / (equityCurveData.length - 1)) * chartWidth,
        y: chartY + chartHeight - ((d.equity - scaledMin) / scaledRange) * chartHeight,
      }));

      for (let i = 1; i < points.length; i++) {
        // Color based on whether equity is positive or negative at that point
        const isPositive = equityCurveData[i].equity >= 0;
        doc.setDrawColor(isPositive ? successColor[0] : dangerColor[0], isPositive ? successColor[1] : dangerColor[1], isPositive ? successColor[2] : dangerColor[2]);
        doc.line(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
      }

      // Draw axes labels
      doc.setFontSize(7);
      doc.setTextColor(...grayColor);
      doc.text(`$${scaledMax.toFixed(0)}`, chartX - 3, chartY + 3, { align: "right" });
      doc.text(`$${scaledMin.toFixed(0)}`, chartX - 3, chartY + chartHeight, { align: "right" });
      doc.text("1", chartX, chartY + chartHeight + 8, { align: "center" });
      doc.text(`${equityCurveData.length}`, chartX + chartWidth, chartY + chartHeight + 8, { align: "center" });
      doc.text("Operaciones", chartX + chartWidth / 2, chartY + chartHeight + 8, { align: "center" });

      // Final P&L label
      const lastPoint = points[points.length - 1];
      const lastEquity = equityCurveData[equityCurveData.length - 1].equity;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(lastEquity >= 0 ? successColor[0] : dangerColor[0], lastEquity >= 0 ? successColor[1] : dangerColor[1], lastEquity >= 0 ? successColor[2] : dangerColor[2]);
      doc.text(`$${lastEquity.toFixed(2)}`, lastPoint.x + 3, lastPoint.y - 2);

      yPos += chartHeight + 20;
    }

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

    // Check if we need a new page
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = 20;
    }

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
      body: sortedActualTrades.map(trade => [
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

    // Generate filename with date range
    let filename = "informe-trading-edgecore";
    if (preset !== "all" && startDate && endDate) {
      filename += `-${startDate}-a-${endDate}`;
    } else {
      filename += `-${format(new Date(), "yyyy-MM-dd")}`;
    }
    filename += ".pdf";

    doc.save(filename);
    toast.success("Informe PDF descargado exitosamente");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Descargar Informe PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generar Informe PDF</DialogTitle>
          <DialogDescription>
            Selecciona el período para generar el informe con métricas y curva de equity.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Período</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={preset === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetChange("all")}
                className="w-full"
              >
                Todos los datos
              </Button>
              <Button
                variant={preset === "thisMonth" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetChange("thisMonth")}
                className="w-full"
              >
                Este mes
              </Button>
              <Button
                variant={preset === "lastMonth" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetChange("lastMonth")}
                className="w-full"
              >
                Mes pasado
              </Button>
              <Button
                variant={preset === "thisYear" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetChange("thisYear")}
                className="w-full"
              >
                Este año
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rango personalizado</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Desde</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPreset("custom");
                  }}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Hasta</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPreset("custom");
                  }}
                />
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {filteredTrades.length} operaciones en el período seleccionado
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={generateReport} disabled={filteredTrades.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Generar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
