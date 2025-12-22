import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const parseDate = (dateValue: any): string | null => {
    if (!dateValue) return null;
    
    // If it's already a string in YYYY-MM-DD format
    if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    // If it's a number (Excel serial date)
    if (typeof dateValue === "number") {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + dateValue * 86400000);
      return date.toISOString().split("T")[0];
    }
    
    // Try parsing various string formats
    if (typeof dateValue === "string") {
      // Handle d/m/yyyy or dd/mm/yyyy format (European/Spanish format)
      const slashParts = dateValue.split("/");
      if (slashParts.length === 3) {
        let day = parseInt(slashParts[0], 10);
        let month = parseInt(slashParts[1], 10);
        let year = parseInt(slashParts[2], 10);
        
        // Handle 2-digit years
        if (year < 100) {
          year += year > 50 ? 1900 : 2000;
        }
        
        // Spanish format is always d/m/y, so day is first, month is second
        // But if we detect American format (month > 12 is impossible), swap
        if (day > 12 && month <= 12) {
          // This is definitely d/m/y - day can be 13-31, month can't
          // Keep as is
        } else if (month > 12 && day <= 12) {
          // This looks like m/d/y was used - swap
          [day, month] = [month, day];
        }
        // If both are <= 12, assume Spanish d/m/y format
        
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        }
      }
      
      // Handle d-m-yyyy format
      const dashParts = dateValue.split("-");
      if (dashParts.length === 3) {
        const first = parseInt(dashParts[0], 10);
        const second = parseInt(dashParts[1], 10);
        const third = parseInt(dashParts[2], 10);
        
        // If first part is 4 digits, it's YYYY-MM-DD
        if (dashParts[0].length === 4) {
          return `${first}-${String(second).padStart(2, "0")}-${String(third).padStart(2, "0")}`;
        }
        // Otherwise it's D-M-YYYY
        let year = third < 100 ? (third > 50 ? 1900 + third : 2000 + third) : third;
        return `${year}-${String(second).padStart(2, "0")}-${String(first).padStart(2, "0")}`;
      }
    }
    
    // Fallback: try Date constructor
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
    
    return null;
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
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array", cellDates: true });
      
      // Read ALL sheets and merge rows (some Excels split data across tabs or ranges)
      const allRows: ExcelRow[] = [];
      const sheetCounts: Record<string, number> = {};

      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) return;

        const rows: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: "",
        });

        // Only keep sheets that actually look like the trades table
        const looksLikeTrades = rows.some((r) => typeof r.FECHA !== "undefined" || (r as any)["FECHA"]);
        if (!looksLikeTrades) return;

        sheetCounts[sheetName] = rows.length;
        allRows.push(...rows);
      });

      // De-duplicate identical rows (common when sheets overlap)
      const seen = new Set<string>();
      const jsonData: ExcelRow[] = [];
      for (const row of allRows) {
        const key = JSON.stringify(row);
        if (seen.has(key)) continue;
        seen.add(key);
        jsonData.push(row);
      }

      if (jsonData.length === 0) {
        setErrors(["El archivo está vacío o no tiene el formato esperado (no encontré columnas como FECHA)"]); 
        setLoading(false);
        return;
      }

      // Debug sheet stats
      console.log("Excel sheets detected:", {
        sheetNames: workbook.SheetNames,
        sheetCounts,
        mergedRows: jsonData.length,
      });

      setRawData(jsonData);

      // Parse and map the data
      const parsed: ParsedTrade[] = [];
      const parseErrors: string[] = [];
      let skippedTestData = 0;
      let skippedNoDate = 0;

      jsonData.forEach((row, index) => {
        try {
          // Skip rows without a date
          const dateStr = parseDate(row.FECHA);
          if (!dateStr) {
            skippedNoDate++;
            return;
          }
          
          const year = parseInt(dateStr.split("-")[0], 10);
          // Skip rows that look like test data (year before 2020)
          if (year < 2020) {
            skippedTestData++;
            return;
          }

          const pnl = parsePnL(row["P&L"]);
          
          const trade: ParsedTrade = {
            date: dateStr,
            day_of_week: mapDayOfWeek(row.DÍA),
            week_of_month: parseWeekOfMonth(row.SEMANA),
            entry_time: parseTime(row["HORA ENTRADA"]),
            exit_time: row["HORA SALIDA EN 1:2"] || row["HORA SALIDA"] 
              ? parseTime(row["HORA SALIDA EN 1:2"] || row["HORA SALIDA"]) 
              : null,
            trade_type: mapTradeType(row.TIPO),
            entry_model: mapEntryModel(row.MODELO),
            result_type: mapResultType(row.RESULTADO, pnl),
            result_dollars: pnl,
            had_news: row.NOTICIA ? !row.NOTICIA.toUpperCase().includes("NO NEWS") : false,
            news_description: row.NOTICIA && !row.NOTICIA.toUpperCase().includes("NO NEWS") 
              ? row.NOTICIA 
              : null,
            max_rr: parseNumber(row["RR MÁXIMO"]),
            drawdown: parseNumber(row.DRAWDOWN),
            image_link: row["LINK m1 (EJECUCIÓN)"] || row.LINK || null,
            no_trade_day: false,
            risk_percentage: 1,
          };

          parsed.push(trade);
        } catch (err) {
          parseErrors.push(`Fila ${index + 2}: Error al procesar los datos`);
        }
      });

      // Add info about skipped rows
      if (skippedTestData > 0) {
        parseErrors.unshift(`Se omitieron ${skippedTestData} filas de datos de prueba (año < 2020)`);
      }
      if (skippedNoDate > 0) {
        parseErrors.unshift(`Se omitieron ${skippedNoDate} filas sin fecha válida`);
      }
      
      // Log for debugging
      console.log("Excel Import Debug:", {
        totalRows: jsonData.length,
        parsedTrades: parsed.length,
        skippedTestData,
        skippedNoDate,
        errors: parseErrors.length,
        sampleRow: jsonData[0],
        sampleParsedDate: jsonData[0] ? parseDate(jsonData[0].FECHA) : null
      });

      setParsedTrades(parsed);
      setErrors(parseErrors);

      if (parsed.length === 0) {
        setErrors(prev => [...prev, "No se pudieron parsear operaciones válidas del archivo"]);
      }
    } catch (err) {
      console.error("Error reading file:", err);
      setErrors(["Error al leer el archivo. Asegúrate de que es un archivo Excel válido."]);
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
          Importar Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Operaciones desde Excel
          </DialogTitle>
          <DialogDescription>
            Sube un archivo Excel (.xlsx) con tus operaciones. Se mapearán automáticamente las columnas.
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
                    <p className="text-xs text-muted-foreground">.xlsx (Excel)</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    disabled={loading || importing}
                  />
                </label>
              </div>
            </CardContent>
          </Card>

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
