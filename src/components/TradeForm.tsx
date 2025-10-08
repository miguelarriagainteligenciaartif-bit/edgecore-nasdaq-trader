import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  no_trade_day: z.boolean().default(false),
  account_id: z.string().optional(),
  date: z.string().min(1, "Fecha requerida"),
  day_of_week: z.enum(["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]),
  entry_time: z.string().optional(),
  exit_time: z.string().optional(),
  trade_type: z.enum(["Compra", "Venta"]).optional(),
  result_type: z.enum(["TP", "SL"]).optional(),
  had_news: z.boolean().default(false),
  news_description: z.enum(["NFP", "CPI", "PMI Servicios", "PMI Manufacturing", "PCE", "Flash PMI", "FOMC", "Ventas Minoristas", "Otra"]).optional(),
  custom_news_description: z.string().optional(),
  news_time: z.enum(["08:30", "09:45", "10:00"]).optional(),
  execution_timing: z.enum(["Antes de noticia", "Después de noticia"]).optional(),
  entry_model: z.enum(["M1", "M3", "Continuación"]).optional(),
  result_dollars: z.string().optional(),
  image_link: z.string().url().optional().or(z.literal("")),
});

interface TradeFormProps {
  onSuccess: () => void;
}

export const TradeForm = ({ onSuccess }: TradeFormProps) => {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      no_trade_day: false,
      had_news: false,
      result_dollars: "0",
      account_id: "",
    },
  });

  const noTradeDay = form.watch("no_trade_day");
  const hadNews = form.watch("had_news");
  const newsDescription = form.watch("news_description");

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("is_active", true)
      .order("name");
    
    if (!error && data) {
      setAccounts(data);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { error } = await supabase.from("trades").insert({
        user_id: user.id,
        no_trade_day: values.no_trade_day,
        account_id: values.account_id || null,
        date: values.date,
        day_of_week: values.day_of_week,
        entry_time: values.entry_time || null,
        exit_time: values.exit_time || null,
        trade_type: values.trade_type || null,
        result_type: values.result_type || null,
        had_news: values.had_news,
        news_description: values.news_description || null,
        custom_news_description: values.custom_news_description || null,
        news_time: values.news_time || null,
        execution_timing: values.execution_timing || null,
        entry_model: values.entry_model || null,
        result_dollars: values.result_dollars ? parseFloat(values.result_dollars) : null,
        image_link: values.image_link || null,
      });

      if (error) throw error;

      toast.success(values.no_trade_day ? "Día sin entrada registrado" : "Operación registrada exitosamente");
      form.reset();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Error al registrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar Nueva Operación</CardTitle>
        <CardDescription>Completa los detalles de tu trade o registra un día sin entrada</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="no_trade_day"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-warning/20 bg-warning/5 p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-warning">Día sin entrada</FormLabel>
                    <p className="text-sm text-muted-foreground">Marcar si ese día no hubo operación</p>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuenta</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === "none" ? "" : value)} 
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una cuenta (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Ninguna</SelectItem>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} ({account.broker})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="day_of_week"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Día de la Semana</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona día" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map((day) => (
                          <SelectItem key={day} value={day}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="entry_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de Entrada {!noTradeDay && <span className="text-destructive">*</span>}</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} disabled={noTradeDay} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="exit_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de Salida</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} disabled={noTradeDay} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trade_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Operación {!noTradeDay && <span className="text-destructive">*</span>}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={noTradeDay}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Compra">Compra</SelectItem>
                        <SelectItem value="Venta">Venta</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="result_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resultado {!noTradeDay && <span className="text-destructive">*</span>}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={noTradeDay}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="TP o SL" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="TP">TP (Take Profit)</SelectItem>
                        <SelectItem value="SL">SL (Stop Loss)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="entry_model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo de Entrada {!noTradeDay && <span className="text-destructive">*</span>}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={noTradeDay}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona modelo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="M1">M1</SelectItem>
                        <SelectItem value="M3">M3</SelectItem>
                        <SelectItem value="Continuación">Continuación</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="result_dollars"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resultado ($) {!noTradeDay && <span className="text-destructive">*</span>}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} disabled={noTradeDay} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="had_news"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>¿Hubo noticia ese día?</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {hadNews && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="news_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>¿Cuál noticia?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona noticia" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="NFP">NFP (Non-Farm Payrolls)</SelectItem>
                            <SelectItem value="CPI">CPI (Consumer Price Index)</SelectItem>
                            <SelectItem value="PMI Servicios">PMI Servicios</SelectItem>
                            <SelectItem value="PMI Manufacturing">PMI Manufacturing</SelectItem>
                            <SelectItem value="PCE">PCE (Personal Consumption)</SelectItem>
                            <SelectItem value="Flash PMI">Flash PMI</SelectItem>
                            <SelectItem value="FOMC">FOMC</SelectItem>
                            <SelectItem value="Ventas Minoristas">Ventas Minoristas</SelectItem>
                            <SelectItem value="Otra">Otra</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="news_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de Noticia (NY)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Hora" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="08:30">8:30 AM</SelectItem>
                            <SelectItem value="09:45">9:45 AM</SelectItem>
                            <SelectItem value="10:00">10:00 AM</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="execution_timing"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timing de Ejecución</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Antes/Después" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Antes de noticia">Antes de noticia</SelectItem>
                            <SelectItem value="Después de noticia">Después de noticia</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {newsDescription === "Otra" && (
                  <FormField
                    control={form.control}
                    name="custom_news_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Especifica qué noticia</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: GDP, Unemployment Claims, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="image_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link de Imagen (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} disabled={noTradeDay} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registrando..." : (noTradeDay ? "Registrar Día Sin Entrada" : "Registrar Operación")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
