import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
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

interface ExcelRow {
  FECHA?: string;
  DÍA?: string;
  SEMANA?: string;
  "HORA ENTRADA"?: string;
  "HORA SALIDA EN 1:2"?: string;
  NOTICIA?: string;
  MODELO?: string;
  TIPO?: string;
  "RR MÁXIMO"?: number | string;
  DRAWDOWN?: number | string;
  RESULTADO?: string;
  "P&L"?: string | number;
  "LINK m1 (EJECUCIÓN)"?: string;
  MES?: string;
  // Add alternative column names
  "HORA SALIDA"?: string;
  LINK?: string;
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
  max_rr: number | null;
  drawdown: number | null;
  image_link: string | null;
  no_trade_day: boolean;
  risk_percentage: number;
}

type SheetResult = {
  sheetName: string;
  extractedRows: ExcelRow[];
  parsed: ParsedTrade[];
  parseErrors: string[];
  skippedEmpty: number;
  skippedOld: number;
  // Heuristic used to pick the best sheet
  score: number;
};

interface ExcelImporterProps {
  onSuccess: () => void;
  accountId?: string;
}

export function ExcelImporter({ onSuccess, accountId }: ExcelImporterProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [rawData, setRawData] = useState<ExcelRow[]>([]);
  const [parsedTrades, setParsedTrades] = useState<ParsedTrade[]>([]);
  const [sheetResults, setSheetResults] = useState<SheetResult[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [dateFormat, setDateFormat] = useState<"auto" | "dmy" | "mdy">("auto");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedSheetResult = useMemo(() => {
    if (!selectedSheet) return null;
    return sheetResults.find((s) => s.sheetName === selectedSheet) ?? null;
  }, [sheetResults, selectedSheet]);

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

  const formatYmd = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const parseDateFromParts = (year: number, month: number, day: number) => {
    // Use local date constructor to avoid timezone-shift issues.
    const d = new Date(year, month - 1, day, 12, 0, 0, 0);
    return formatYmd(d);
  };

  const parseDate = (dateValue: any, fmt: "dmy" | "mdy"): string => {
    if (!dateValue) return formatYmd(new Date());

    // Already YYYY-MM-DD
    if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }

    // Excel serial date
    if (typeof dateValue === "number") {
      const excelEpoch = new Date(1899, 11, 30);
      const d = new Date(excelEpoch.getTime() + dateValue * 86400000);
      return formatYmd(d);
    }

    // d/m/yyyy or m/d/yyyy
    if (typeof dateValue === "string") {
      const raw = dateValue.trim();
      const parts = raw.split("/");
      if (parts.length === 3) {
        const a = parseInt(parts[0], 10);
        const b = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);

        if (Number.isFinite(a) && Number.isFinite(b) && Number.isFinite(year)) {
          if (year < 100) year += year > 50 ? 1900 : 2000;

          const day = fmt === "dmy" ? a : b;
          const month = fmt === "dmy" ? b : a;

          if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return parseDateFromParts(year, month, day);
          }
        }
      }
    }

    // Fallback
    const d = new Date(dateValue);
    if (!isNaN(d.getTime())) return formatYmd(d);

    return formatYmd(new Date());
  };

  const parseTime = (timeValue: any): string => {
    if (!timeValue) return "09:30:00";
    
    // If it's a number (Excel time fraction)
    if (typeof timeValue === "number") {
      const totalMinutes = Math.round(timeValue * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
    }
    
    // If it's a string
    if (typeof timeValue === "string") {
      // Try to extract time pattern HH:MM:SS or HH:MM
      const match = timeValue.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
      if (match) {
        let hours = parseInt(match[1], 10);
        const minutes = match[2];
        const seconds = match[3] || "00";
        
        // Handle AM/PM
        const isPM = timeValue.toLowerCase().includes("pm") || timeValue.toLowerCase().includes("p.m");
        const isAM = timeValue.toLowerCase().includes("am") || timeValue.toLowerCase().includes("a.m");
        
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
    return isNaN(num) ? 0 : num;
  };

  const parseNumber = (value: any): number | null => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "number") return value;
    
    const str = String(value).replace(/[^0-9.-]/g, "");
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
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
    // Fallback to P&L based
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrors([]);
    setRawData([]);
    setParsedTrades([]);

    try {
      const isCsv = file.name.toLowerCase().endsWith(".csv");
      const workbook = isCsv
        ? XLSX.read(await file.text(), { type: "string" })
        : XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });


      // Some Excel files have data beyond the stored worksheet range (!ref),
      // which can cause the last rows to be missed. Expand the range by scanning
      // all present cells.
      const expandWorksheetRange = (ws: XLSX.WorkSheet) => {
        const originalRef = ws["!ref"];
        if (!originalRef) return;
        const originalRange = XLSX.utils.decode_range(originalRef);

        let maxR = originalRange.e.r;
        let maxC = originalRange.e.c;

        for (const key of Object.keys(ws)) {
          if (key[0] === "!") continue;
          if (!/^[A-Z]+\d+$/.test(key)) continue;
          const cell = XLSX.utils.decode_cell(key);
          if (cell.r > maxR) maxR = cell.r;
          if (cell.c > maxC) maxC = cell.c;
        }

        ws["!ref"] = XLSX.utils.encode_range({ s: originalRange.s, e: { r: maxR, c: maxC } });
      };

      const normalizeHeader = (v: any) =>
        String(v ?? "")
          .trim()
          .toUpperCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

      const getCellText = (ws: XLSX.WorkSheet, r: number, c: number) => {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = ws[addr] as XLSX.CellObject | undefined;
        if (!cell) return "";
        const val = (cell as any).w ?? (cell as any).v;
        return String(val ?? "").trim();
      };

      const processWorksheet = (ws: XLSX.WorkSheet, name: string) => {
        expandWorksheetRange(ws);

        const rangeRef = ws["!ref"];
        if (!rangeRef) {
          return {
            ok: false as const,
            sheetName: name,
            extractedRows: [] as ExcelRow[],
            parsed: [] as ParsedTrade[],
            parseErrors: ["No se pudo leer el rango de la hoja"],
            skippedEmpty: 0,
            skippedOld: 0,
          };
        }

        const range = XLSX.utils.decode_range(rangeRef);

        // Find header row by scanning first ~80 rows
        let headerRow = -1;
        let headerMap: Record<string, number> = {};

        for (let r = range.s.r; r <= Math.min(range.e.r, range.s.r + 80); r++) {
          const candidate: Record<string, number> = {};
          for (let c = range.s.c; c <= range.e.c; c++) {
            const h = normalizeHeader(getCellText(ws, r, c));
            if (!h) continue;
            candidate[h] = c;
          }

          if (
            candidate["FECHA"] !== undefined &&
            candidate["DIA"] !== undefined &&
            candidate["HORA ENTRADA"] !== undefined
          ) {
            headerRow = r;
            headerMap = candidate;
            break;
          }
        }

        if (headerRow === -1) {
          return {
            ok: false as const,
            sheetName: name,
            extractedRows: [] as ExcelRow[],
            parsed: [] as ParsedTrade[],
            parseErrors: ["No encontré encabezados (FECHA/DÍA/HORA ENTRADA)"],
            skippedEmpty: 0,
            skippedOld: 0,
          };
        }

        const col = {
          FECHA: headerMap["FECHA"],
          DIA: headerMap["DIA"],
          SEMANA: headerMap["SEMANA"],
          HORA_ENTRADA: headerMap["HORA ENTRADA"],
          HORA_SALIDA_12: headerMap["HORA SALIDA EN 1:2"],
          HORA_SALIDA: headerMap["HORA SALIDA"],
          NOTICIA: headerMap["NOTICIA"],
          MODELO: headerMap["MODELO"],
          TIPO: headerMap["TIPO"],
          RR_MAXIMO: headerMap["RR MAXIMO"],
          DRAWDOWN: headerMap["DRAWDOWN"],
          RESULTADO: headerMap["RESULTADO"],
          PNL: headerMap["P&L"],
          MES: headerMap["MES"],
          LINK:
            headerMap["LINK M1 (EJECUCION)"] ??
            headerMap["LINK M1 (EJECUCION)"] ??
            headerMap["LINK"],
        };

        const extractedRows: ExcelRow[] = [];
        for (let r = headerRow + 1; r <= range.e.r; r++) {
          extractedRows.push({
            FECHA: col.FECHA !== undefined ? getCellText(ws, r, col.FECHA) : "",
            DÍA: col.DIA !== undefined ? getCellText(ws, r, col.DIA) : "",
            SEMANA: col.SEMANA !== undefined ? getCellText(ws, r, col.SEMANA) : "",
            "HORA ENTRADA": col.HORA_ENTRADA !== undefined ? getCellText(ws, r, col.HORA_ENTRADA) : "",
            "HORA SALIDA EN 1:2": col.HORA_SALIDA_12 !== undefined ? getCellText(ws, r, col.HORA_SALIDA_12) : "",
            "HORA SALIDA": col.HORA_SALIDA !== undefined ? getCellText(ws, r, col.HORA_SALIDA) : "",
            NOTICIA: col.NOTICIA !== undefined ? getCellText(ws, r, col.NOTICIA) : "",
            MODELO: col.MODELO !== undefined ? getCellText(ws, r, col.MODELO) : "",
            TIPO: col.TIPO !== undefined ? getCellText(ws, r, col.TIPO) : "",
            "RR MÁXIMO": col.RR_MAXIMO !== undefined ? getCellText(ws, r, col.RR_MAXIMO) : "",
            DRAWDOWN: col.DRAWDOWN !== undefined ? getCellText(ws, r, col.DRAWDOWN) : "",
            RESULTADO: col.RESULTADO !== undefined ? getCellText(ws, r, col.RESULTADO) : "",
            "P&L": col.PNL !== undefined ? getCellText(ws, r, col.PNL) : "",
            "LINK m1 (EJECUCIÓN)": col.LINK !== undefined ? getCellText(ws, r, col.LINK) : "",
            MES: col.MES !== undefined ? getCellText(ws, r, col.MES) : "",
          });
        }

        const parsed: ParsedTrade[] = [];
        const parseErrors: string[] = [];
        let skippedEmpty = 0;
        let skippedOld = 0;

        const detectFormatFromRows = (): "dmy" | "mdy" => {
          // Strong signal: MES column (if present) lets us disambiguate 7/8/2025.
          let dmyVotes = 0;
          let mdyVotes = 0;

          for (const r of extractedRows) {
            const raw = String(r.FECHA ?? "").trim();
            if (!raw.includes("/")) continue;
            const parts = raw.split("/");
            if (parts.length !== 3) continue;
            const a = parseInt(parts[0], 10);
            const b = parseInt(parts[1], 10);
            const mes = parseInt(String((r as any).MES ?? ""), 10);

            if (!Number.isFinite(a) || !Number.isFinite(b)) continue;

            // If MES exists and matches one side, vote strongly.
            if (Number.isFinite(mes) && mes >= 1 && mes <= 12) {
              if (mes === b) dmyVotes += 5; // d/m/y -> month is second
              if (mes === a) mdyVotes += 5; // m/d/y -> month is first
            }

            // Secondary heuristic when MES is absent:
            if (a > 12 && a <= 31) dmyVotes += 2;
            if (b > 12 && b <= 31) mdyVotes += 2;
          }

          // Default to DMY for Spanish datasets unless evidence suggests MDY.
          return mdyVotes > dmyVotes ? "mdy" : "dmy";
        };

        const effectiveDateFormat: "dmy" | "mdy" =
          dateFormat === "auto" ? detectFormatFromRows() : dateFormat;

        extractedRows.forEach((row, index) => {
          try {
            // Consider a row "usable" if it has a date.
            const hasDate = String(row.FECHA ?? "").trim() !== "";

            if (!hasDate) {
              skippedEmpty++;
              return;
            }

            const dateStr = parseDate(row.FECHA, effectiveDateFormat);
            const year = parseInt(dateStr.split("-")[0], 10);
            if (year < 2020) {
              skippedOld++;
              return;
            }

            const pnl = parsePnL(row["P&L"]);

            parsed.push({
              date: dateStr,
              day_of_week: mapDayOfWeek(row.DÍA),
              week_of_month: parseWeekOfMonth(row.SEMANA),
              entry_time: parseTime(row["HORA ENTRADA"]),
              exit_time:
                row["HORA SALIDA EN 1:2"] || row["HORA SALIDA"]
                  ? parseTime(row["HORA SALIDA EN 1:2"] || row["HORA SALIDA"])
                  : null,
              trade_type: mapTradeType(row.TIPO),
              entry_model: mapEntryModel(row.MODELO),
              result_type: mapResultType(row.RESULTADO, pnl),
              result_dollars: pnl,
              had_news: row.NOTICIA ? !row.NOTICIA.toUpperCase().includes("NO NEWS") : false,
              news_description:
                row.NOTICIA && !row.NOTICIA.toUpperCase().includes("NO NEWS") ? row.NOTICIA : null,
              max_rr: parseNumber(row["RR MÁXIMO"]),
              drawdown: parseNumber(row.DRAWDOWN),
              image_link: row["LINK m1 (EJECUCIÓN)"] || row.LINK || null,
              no_trade_day: false,
              risk_percentage: 1,
            });
          } catch {
            const excelRowNumber = headerRow + 1 + (index + 1);
            parseErrors.push(`Fila ${excelRowNumber}: Error al procesar los datos`);
          }
        });

        return {
          ok: true as const,
          sheetName: name,
          extractedRows,
          parsed,
          parseErrors,
          skippedEmpty,
          skippedOld,
        };
      };

      // Auto-detect the correct sheet (some workbooks put DATA after other tabs)
      const results = workbook.SheetNames.map((name) => processWorksheet(workbook.Sheets[name], name));
      const best = results
        .filter((r) => r.ok)
        .sort((a, b) => b.parsed.length - a.parsed.length)[0];

      if (!best || best.parsed.length === 0) {
        const reasons = results
          .map((r) => `${r.sheetName}: ${r.parseErrors[0] ?? "sin datos"}`)
          .slice(0, 5)
          .join(" | ");
        setErrors([
          "No se pudieron detectar operaciones válidas en ninguna hoja.",
          reasons,
        ]);
        setLoading(false);
        return;
      }

      const detectedFmtLabel =
        dateFormat === "auto"
          ? "Auto"
          : dateFormat === "dmy"
          ? "Día/Mes/Año"
          : "Mes/Día/Año";

      toast.info(
        `Hoja: ${best.sheetName} · ${best.extractedRows.length} filas leídas · ${best.parsed.length} operaciones válidas · ${best.skippedOld} antiguas · ${best.skippedEmpty} vacías · ${best.parseErrors.length} con error · formato: ${detectedFmtLabel}`
      );

      setRawData(best.extractedRows);
      setParsedTrades(best.parsed);
      setErrors(best.parseErrors);

      if (best.parsed.length === 0) {
        setErrors((prev) => [...prev, "No se pudieron parsear operaciones válidas del archivo"]);
      }
    } catch (err) {
      console.error("Error reading file:", err);
      setErrors(["Error al leer el archivo. Asegúrate de que es un archivo CSV válido."]);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (parsedTrades.length === 0) return;

    setImporting(true);
    setProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Debes iniciar sesión para importar operaciones");
        return;
      }

      const batchSize = 50;
      const batches = [];
      
      for (let i = 0; i < parsedTrades.length; i += batchSize) {
        batches.push(parsedTrades.slice(i, i + batchSize));
      }

      let imported = 0;
      const importErrors: string[] = [];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const insertData = batch.map(trade => ({
          ...trade,
          user_id: user.id,
          account_id: accountId || null,
        }));

        const { error } = await supabase
          .from("trades")
          .insert(insertData);

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
        setRawData([]);
        setParsedTrades([]);
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

  const resetState = () => {
    setRawData([]);
    setParsedTrades([]);
    setErrors([]);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetState();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Operaciones desde CSV
          </DialogTitle>
          <DialogDescription>
            Sube un archivo CSV (exportado desde Google Sheets) con tus operaciones. Se mapearán automáticamente las columnas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Input */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click para seleccionar</span> o arrastra un archivo
                    </p>
                    <p className="text-xs text-muted-foreground">.csv (exportado desde Google Sheets)</p>
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

          {/* Date format */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Formato de fecha</p>
              <p className="text-xs text-muted-foreground">Si los meses salen mal, cámbialo aquí y vuelve a importar.</p>
            </div>
            <Select value={dateFormat} onValueChange={(v) => setDateFormat(v as "auto" | "dmy" | "mdy")}>
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

          {/* Loading State */}
          {loading && (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Procesando archivo...</p>
            </div>
          )}

          {/* Errors */}
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
                  {errors.slice(0, 5).map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                  {errors.length > 5 && (
                    <li className="text-muted-foreground">...y {errors.length - 5} más</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Preview */}
          {parsedTrades.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Vista previa ({parsedTrades.length} operaciones)
                </CardTitle>
                <CardDescription>
                  Revisa que los datos se hayan parseado correctamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-64">
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
                      {parsedTrades.slice(0, 10).map((trade, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">{trade.date}</TableCell>
                          <TableCell className="text-xs">{trade.day_of_week}</TableCell>
                          <TableCell className="text-xs">{trade.entry_time}</TableCell>
                          <TableCell>
                            <Badge variant={trade.trade_type === "Compra" ? "default" : "secondary"} className="text-xs">
                              {trade.trade_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{trade.entry_model}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={trade.result_type === "TP" ? "default" : "destructive"} 
                              className="text-xs"
                            >
                              {trade.result_type}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right text-xs font-mono ${trade.result_dollars >= 0 ? "text-success" : "text-destructive"}`}>
                            ${trade.result_dollars.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {parsedTrades.length > 10 && (
                    <p className="text-center text-xs text-muted-foreground py-2">
                      ...y {parsedTrades.length - 10} operaciones más
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Progress */}
          {importing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                Importando... {progress}%
              </p>
            </div>
          )}

          {/* Actions */}
          {parsedTrades.length > 0 && !importing && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetState}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleImport}>
                <Upload className="h-4 w-4 mr-2" />
                Importar {parsedTrades.length} operaciones
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
