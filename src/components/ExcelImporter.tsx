import { useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";

type DateFormat = "auto" | "dmy" | "mdy";

interface CsvRow {
  [key: string]: string | undefined;
}

interface ParsedTrade {
  date: string;
  day_of_week: string;
  week_of_month: number;
  entry_time: string;
  exit_time: string | null;
  trade_type: string;
  entry_model: string;
  result_type: string;
  result_dollars: number;
  had_news: boolean;
  news_description: string | null;
  custom_news_description: string | null;
  max_rr: number | null;
  drawdown: number | null;
  image_link: string | null;
  no_trade_day: boolean;
  risk_percentage: number;
  notes: string | null;
  news_time: string | null;
  execution_timing: string | null;
}

interface PreviewRow {
  parsed: ParsedTrade;
  rawFecha: string;
  rawMes: string;
}

interface ExcelImporterProps {
  onSuccess: () => void;
  accountId?: string;
}

const normalizeHeader = (v: any) =>
  String(v ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");

const formatYmd = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const parseDateFromParts = (year: number, month: number, day: number) => {
  const d = new Date(year, month - 1, day, 12, 0, 0, 0);
  return formatYmd(d);
};

const parseWeekOfMonth = (semana: string | undefined): number => {
  if (!semana) return 1;
  const cleaned = semana.toUpperCase().replace(/[^0-9A-Z]/g, "");
  if (cleaned.includes("1") || cleaned.includes("1ST")) return 1;
  if (cleaned.includes("2") || cleaned.includes("2ND")) return 2;
  if (cleaned.includes("3") || cleaned.includes("3RD")) return 3;
  if (cleaned.includes("4") || cleaned.includes("4TH")) return 4;
  if (cleaned.includes("5") || cleaned.includes("5TH")) return 5;
  return 1;
};

const parseTime = (timeValue: any): string => {
  if (!timeValue) return "09:30:00";

  if (typeof timeValue === "string") {
    const match = timeValue.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2];
      const seconds = match[3] || "00";

      const lower = timeValue.toLowerCase();
      const isPM = lower.includes("pm") || lower.includes("p.m");
      const isAM = lower.includes("am") || lower.includes("a.m");
      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;

      return `${String(hours).padStart(2, "0")}:${minutes}:${seconds}`;
    }
  }

  return "09:30:00";
};

const parsePnL = (value: any): number => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const str = String(value)
    .replace(/[$,]/g, "")
    .replace(/\s/g, "")
    .trim();
  const num = parseFloat(str);
  return Number.isFinite(num) ? num : 0;
};

const parseNumber = (value: any): number | null => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  const str = String(value).replace(/[^0-9.-]/g, "");
  const num = parseFloat(str);
  return Number.isFinite(num) ? num : null;
};

const mapTradeType = (tipo: string | undefined): string => {
  if (!tipo) return "Compra";
  const t = tipo.toUpperCase();
  if (t === "BUY" || t === "LONG" || t === "COMPRA") return "Compra";
  if (t === "SELL" || t === "SHORT" || t === "VENTA") return "Venta";
  return "Compra";
};

const mapDayOfWeek = (dia: string | undefined): string => {
  if (!dia) return "Lunes";
  const d = dia.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (d.includes("LUN") || d.includes("MON")) return "Lunes";
  if (d.includes("MAR") || d.includes("TUE")) return "Martes";
  if (d.includes("MIE") || d.includes("WED")) return "Miércoles";
  if (d.includes("JUE") || d.includes("THU")) return "Jueves";
  if (d.includes("VIE") || d.includes("FRI")) return "Viernes";
  return "Lunes";
};

const mapResultType = (resultado: string | undefined, pnl: number): string => {
  if (resultado) {
    const r = resultado.toUpperCase();
    if (r.includes("TP") || r.includes("WIN") || r.includes("PROFIT")) return "TP";
    if (r.includes("SL") || r.includes("LOSS") || r.includes("STOP")) return "SL";
    if (r.includes("BE") || r.includes("BREAK")) return "BE";
  }
  return pnl >= 0 ? "TP" : "SL";
};

const mapEntryModel = (modelo: string | undefined): string => {
  if (!modelo) return "M1";
  const m = modelo.toUpperCase();
  if (m === "M1" || m.includes("M1")) return "M1";
  if (m === "M3" || m.includes("M3")) return "M3";
  if (m.includes("CONT") || m.includes("CONTINUATION")) return "Continuación";
  return modelo;
};

const parseFechaWithMesGuarantee = (rawFecha: string, rawMes: string, fmt: Exclude<DateFormat, "auto">): string | null => {
  const parts = String(rawFecha ?? "").trim().split("/");
  if (parts.length !== 3) return null;

  const a = parseInt(parts[0], 10);
  const b = parseInt(parts[1], 10);
  let year = parseInt(parts[2], 10);
  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(year)) return null;
  if (year < 100) year += year > 50 ? 1900 : 2000;

  const mes = parseInt(String(rawMes ?? ""), 10);
  if (!Number.isFinite(mes) || mes < 1 || mes > 12) return null;

  const day = fmt === "dmy" ? a : b;
  if (!Number.isFinite(day) || day < 1 || day > 31) return null;

  return parseDateFromParts(year, mes, day);
};

/** Try to parse ISO date (YYYY-MM-DD) */
const parseIsoDate = (rawFecha: string): string | null => {
  const match = rawFecha.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return parseDateFromParts(year, month, day);
};

/**
 * Detect if CSV has summary/metadata rows before the actual trade data.
 * Returns the text starting from the detected header row onward.
 */
const extractTradeData = (text: string): string => {
  const lines = text.split(/\r?\n/);
  
  // Look for a header row that contains trade-related columns
  const tradeHeaderPatterns = [
    /fecha/i,
  ];
  const tradeHeaderRequired = [
    // Must have at least 2 of these to be a trade header
    /hora\s*entrada/i, /entry.*time/i, /tipo/i, /type/i, /resultado/i, /result/i, /p&l/i, /modelo/i, /model/i,
  ];
  
  for (let i = 0; i < Math.min(lines.length, 60); i++) {
    const line = lines[i];
    const hasFecha = tradeHeaderPatterns.some(p => p.test(line));
    if (!hasFecha) continue;
    
    const matchCount = tradeHeaderRequired.filter(p => p.test(line)).length;
    if (matchCount >= 2) {
      // Found the header row — return from here onward
      return lines.slice(i).join("\n");
    }
  }
  
  // No summary detected, return as-is
  return text;
};

export function ExcelImporter({ onSuccess, accountId }: ExcelImporterProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [dateFormat, setDateFormat] = useState<DateFormat>("auto");
  const [isDragging, setIsDragging] = useState(false);

  const [rawRows, setRawRows] = useState<CsvRow[]>([]);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectedAuto = useMemo<Exclude<DateFormat, "auto">>(() => {
    if (dateFormat !== "auto") return dateFormat;

    let dmyVotes = 0;
    let mdyVotes = 0;
    for (const r of rawRows.slice(0, 80)) {
      const rawFecha = String(getValue(r, "FECHA") ?? "").trim();
      if (!rawFecha.includes("/")) continue;
      const parts = rawFecha.split("/");
      if (parts.length !== 3) continue;
      const a = parseInt(parts[0], 10);
      const b = parseInt(parts[1], 10);
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
      if (a > 12 && a <= 31) dmyVotes += 2;
      if (b > 12 && b <= 31) mdyVotes += 2;
    }
    return mdyVotes > dmyVotes ? "mdy" : "dmy";
  }, [dateFormat, rawRows]);

  function getValue(row: CsvRow, header: string) {
    const desired = normalizeHeader(header);
    for (const [k, v] of Object.entries(row)) {
      if (normalizeHeader(k) === desired) return v;
    }
    return undefined;
  }

  /** Get value checking multiple possible header names */
  function getValueMulti(row: CsvRow, ...headers: string[]) {
    for (const h of headers) {
      const v = getValue(row, h);
      if (v !== undefined && v !== "") return v;
    }
    return undefined;
  }

  const resetState = () => {
    setErrors([]);
    setProgress(0);
    setRawRows([]);
    setPreviewRows([]);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.csv')) {
        processFile(file);
      } else {
        toast.error("Solo se permiten archivos CSV");
      }
    }
  };

  const parseRowToTrade = (r: CsvRow, fmt: Exclude<DateFormat, "auto">): { trade: ParsedTrade; rawFecha: string; rawMes: string } | null => {
    // --- DATE ---
    const rawFecha = String(getValueMulti(r, "FECHA", "DATE") ?? "").trim();
    if (!rawFecha) return null;

    let dateStr: string | null = null;

    // Try ISO format first (YYYY-MM-DD)
    dateStr = parseIsoDate(rawFecha);

    // Try MES-guaranteed construction
    const rawMes = String(getValue(r, "MES") ?? "").trim();
    if (!dateStr && rawMes) {
      dateStr = parseFechaWithMesGuarantee(rawFecha, rawMes, fmt);
    }

    // Fallback: slash-separated
    if (!dateStr && rawFecha.includes("/")) {
      const parts = rawFecha.split("/");
      if (parts.length === 3) {
        const a = parseInt(parts[0], 10);
        const b = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);
        if (Number.isFinite(a) && Number.isFinite(b) && Number.isFinite(year)) {
          if (year < 100) year += year > 50 ? 1900 : 2000;
          const day = fmt === "dmy" ? a : b;
          const month = fmt === "dmy" ? b : a;
          if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            dateStr = parseDateFromParts(year, month, day);
          }
        }
      }
    }

    if (!dateStr) return null;

    const year = parseInt(dateStr.split("-")[0], 10);
    if (year < 2020) return null;

    const pnl = parsePnL(getValueMulti(r, "P&L", "PNL", "PROFIT"));

    // --- NEWS ---
    // Support both formats:
    // Format 1 (old): Single "NOTICIA" column with description or "NO NEWS"
    // Format 2 (Quantum): "Noticias" = Sí/No, "Descripción Noticias" = text, "Hora Noticias" = time
    const noticiaRaw = getValueMulti(r, "NOTICIAS", "NOTICIA");
    const descripcionNoticias = getValueMulti(r, "DESCRIPCION NOTICIAS", "DESCRIPCIÓN NOTICIAS");
    const horaNoticiasRaw = getValueMulti(r, "HORA NOTICIAS");

    let hadNews = false;
    let newsDescription: string | null = null;
    let newsTime: string | null = null;

    if (noticiaRaw) {
      const upper = noticiaRaw.toUpperCase().trim();
      if (upper === "SI" || upper === "SÍ" || upper === "YES" || upper === "TRUE") {
        hadNews = true;
        newsDescription = descripcionNoticias || null;
      } else if (upper === "NO" || upper === "FALSE" || upper.includes("NO NEWS")) {
        hadNews = false;
      } else {
        // Old format: the value itself is the description
        hadNews = true;
        newsDescription = noticiaRaw;
      }
    }

    if (horaNoticiasRaw) {
      newsTime = parseTime(horaNoticiasRaw);
      if (newsTime === "09:30:00" && !horaNoticiasRaw.includes("9")) newsTime = null;
    }

    // --- NO TRADE DAY ---
    const noTradeDayRaw = getValueMulti(r, "NO TRADE DAY", "NO TRADE");
    let noTradeDay = false;
    if (noTradeDayRaw) {
      const upper = noTradeDayRaw.toUpperCase().trim();
      noTradeDay = upper === "SI" || upper === "SÍ" || upper === "YES" || upper === "TRUE";
    }

    // --- EXECUTION TIMING ---
    const executionTiming = getValueMulti(r, "TIMING EJECUCION", "TIMING EJECUCIÓN", "EXECUTION TIMING") || null;

    // --- NOTES ---
    const notes = getValueMulti(r, "NOTAS", "NOTES") || null;

    const trade: ParsedTrade = {
      date: dateStr,
      day_of_week: mapDayOfWeek(getValueMulti(r, "DIA", "DÍA", "DAY")),
      week_of_month: parseWeekOfMonth(getValueMulti(r, "SEMANA", "WEEK")),
      entry_time: parseTime(getValueMulti(r, "HORA ENTRADA", "ENTRY TIME")),
      exit_time: (() => {
        const v = getValueMulti(r, "HORA SALIDA EN 1:2", "HORA SALIDA", "EXIT TIME");
        return v ? parseTime(v) : null;
      })(),
      trade_type: mapTradeType(getValueMulti(r, "TIPO", "TYPE")),
      entry_model: mapEntryModel(getValueMulti(r, "MODELO", "MODEL")),
      result_type: mapResultType(getValueMulti(r, "RESULTADO", "RESULT"), pnl),
      result_dollars: pnl,
      had_news: hadNews,
      news_description: newsDescription,
      custom_news_description: descripcionNoticias || null,
      max_rr: parseNumber(getValueMulti(r, "MAX RR", "RR MAXIMO", "RR MÁXIMO")),
      drawdown: parseNumber(getValueMulti(r, "DRAWDOWN")),
      image_link: getValueMulti(r, "LINK M1 (EJECUCION)", "LINK M1 (EJECUCIÓN)", "LINK") ?? null,
      no_trade_day: noTradeDay,
      risk_percentage: 1,
      notes: notes,
      news_time: newsTime,
      execution_timing: executionTiming,
    };

    return { trade, rawFecha, rawMes };
  };

  const processFile = async (file: File) => {
    setLoading(true);
    setErrors([]);
    setRawRows([]);
    setPreviewRows([]);

    try {
      let text = await file.text();
      
      // Strip BOM
      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

      // Detect and skip summary/metadata rows
      text = extractTradeData(text);

      const parsed = Papa.parse<CsvRow>(text, {
        header: true,
        skipEmptyLines: "greedy",
        transformHeader: (h) => h,
      });

      if (parsed.errors?.length) {
        setErrors(parsed.errors.slice(0, 5).map((e) => `CSV: ${e.message}`));
      }

      const rows = (parsed.data ?? []).filter((r) => Object.keys(r ?? {}).length > 0);
      setRawRows(rows);

      const fmt = dateFormat === "auto" ? detectedAuto : dateFormat;
      const previews: PreviewRow[] = [];
      let valid = 0;
      let skippedOld = 0;
      let skippedEmpty = 0;

      for (const r of rows) {
        const rawFecha = String(getValueMulti(r, "FECHA", "DATE") ?? "").trim();
        if (!rawFecha) {
          skippedEmpty++;
          continue;
        }

        const result = parseRowToTrade(r, fmt);
        if (!result) continue;

        valid++;
        if (previews.length < 50) {
          previews.push({ parsed: result.trade, rawFecha: result.rawFecha, rawMes: result.rawMes });
        }
      }

      toast.info(
        `CSV: ${rows.length} filas leídas · ${valid} operaciones válidas · ${skippedOld} antiguas · ${skippedEmpty} vacías`
      );

      setPreviewRows(previews);

      if (valid === 0) {
        setErrors((prev) => [...prev, "No se pudieron detectar operaciones válidas. Verifica que el CSV tenga columnas como Fecha, Tipo, Resultado, P&L."]);
      }
    } catch (err) {
      console.error("CSV read error:", err);
      setErrors(["Error al leer el archivo. Asegúrate de que es un CSV válido."]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleImport = async () => {
    if (previewRows.length === 0) return;

    setImporting(true);
    setProgress(0);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Debes iniciar sesión para importar operaciones");
        return;
      }

      const fmt = dateFormat === "auto" ? detectedAuto : dateFormat;
      const parsedTrades: ParsedTrade[] = [];

      for (const r of rawRows) {
        const result = parseRowToTrade(r, fmt);
        if (result) parsedTrades.push(result.trade);
      }

      const batchSize = 50;
      const batches: ParsedTrade[][] = [];
      for (let i = 0; i < parsedTrades.length; i += batchSize) {
        batches.push(parsedTrades.slice(i, i + batchSize));
      }

      let imported = 0;
      const importErrors: string[] = [];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const insertData = batch.map((trade) => ({
          ...trade,
          user_id: user.id,
          account_id: accountId || null,
        }));

        const { error } = await supabase.from("trades").insert(insertData);
        if (error) {
          importErrors.push(`Lote ${i + 1}: ${error.message}`);
        } else {
          imported += batch.length;
        }

        setProgress(Math.round(((i + 1) / batches.length) * 100));
      }

      if (importErrors.length > 0) {
        toast.error(`Errores durante la importación: ${importErrors.length} lotes fallaron`);
        setErrors(importErrors);
      } else {
        toast.success(`Se importaron ${imported} operaciones correctamente`);
        setOpen(false);
        resetState();
        onSuccess();
      }
    } catch (err) {
      console.error("Import error:", err);
      toast.error("Error durante la importación");
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetState();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Operaciones desde CSV
          </DialogTitle>
          <DialogDescription>Sube un archivo CSV con tus operaciones. Compatible con Quantum Trading, Google Sheets y otros formatos.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center w-full">
                <label 
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    isDragging 
                      ? "border-primary bg-primary/10" 
                      : "hover:bg-muted/50"
                  }`}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">
                    <Upload className={`h-8 w-8 mb-2 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="mb-2 text-sm text-muted-foreground">
                      {isDragging ? (
                        <span className="font-semibold text-primary">Suelta el archivo aquí</span>
                      ) : (
                        <>
                          <span className="font-semibold">Click para seleccionar</span> o arrastra un archivo
                        </>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">.csv</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileSelect}
                    disabled={loading || importing}
                  />
                </label>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Formato de fecha</p>
              <p className="text-xs text-muted-foreground">
                Fechas ISO (2025-08-01) se detectan automáticamente. Para fechas tipo 7/8/2025, selecciona el formato.
              </p>
            </div>
            <Select value={dateFormat} onValueChange={(v) => setDateFormat(v as DateFormat)}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-detectar</SelectItem>
                <SelectItem value="dmy">Día/Mes/Año</SelectItem>
                <SelectItem value="mdy">Mes/Día/Año</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading && (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Procesando archivo...</p>
            </div>
          )}

          {errors.length > 0 && (
            <Card className="border-destructive">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Errores encontrados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {errors.slice(0, 6).map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                  {errors.length > 6 && <li className="text-muted-foreground">...y {errors.length - 6} más</li>}
                </ul>
              </CardContent>
            </Card>
          )}

          {previewRows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Vista previa ({Math.min(previewRows.length, 50)} filas)
                </CardTitle>
                <CardDescription>
                  Verifica que las fechas y datos se interpretan correctamente antes de importar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-80">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Día</TableHead>
                        <TableHead>Hora</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Resultado</TableHead>
                        <TableHead className="text-right">P&L</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewRows.slice(0, 10).map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs font-mono">{r.parsed.date}</TableCell>
                          <TableCell className="text-xs">{r.parsed.day_of_week}</TableCell>
                          <TableCell className="text-xs">{r.parsed.entry_time}</TableCell>
                          <TableCell>
                            <Badge variant={r.parsed.trade_type === "Compra" ? "default" : "secondary"} className="text-xs">
                              {r.parsed.trade_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {r.parsed.entry_model}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={r.parsed.result_type === "TP" ? "default" : "destructive"} className="text-xs">
                              {r.parsed.result_type}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={`text-right text-xs font-mono ${r.parsed.result_dollars >= 0 ? "text-success" : "text-destructive"}`}
                          >
                            ${r.parsed.result_dollars.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {importing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">Importando... {progress}%</p>
            </div>
          )}

          {!importing && previewRows.length > 0 && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetState}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleImport}>
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
