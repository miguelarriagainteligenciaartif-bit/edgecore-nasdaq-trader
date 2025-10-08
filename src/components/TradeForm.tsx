import { useState } from "react";
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
  date: z.string().min(1, "Fecha requerida"),
  day_of_week: z.enum(["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]),
  entry_time: z.string().min(1, "Hora de entrada requerida"),
  exit_time: z.string().optional(),
  trade_type: z.enum(["Compra", "Venta"]),
  result_type: z.enum(["TP", "SL"]),
  had_news: z.boolean().default(false),
  news_description: z.string().optional(),
  execution_timing: z.enum(["Antes de noticia", "Después de noticia"]).optional(),
  entry_model: z.enum(["M1", "M3", "Continuación"]),
  result_dollars: z.string().min(1, "Resultado requerido"),
  image_link: z.string().url().optional().or(z.literal("")),
});

interface TradeFormProps {
  onSuccess: () => void;
}

export const TradeForm = ({ onSuccess }: TradeFormProps) => {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      had_news: false,
      result_dollars: "0",
    },
  });

  const hadNews = form.watch("had_news");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { error } = await supabase.from("trades").insert({
        user_id: user.id,
        date: values.date,
        day_of_week: values.day_of_week,
        entry_time: values.entry_time,
        exit_time: values.exit_time || null,
        trade_type: values.trade_type,
        result_type: values.result_type,
        had_news: values.had_news,
        news_description: values.news_description || null,
        execution_timing: values.execution_timing || null,
        entry_model: values.entry_model,
        result_dollars: parseFloat(values.result_dollars),
        image_link: values.image_link || null,
      });

      if (error) throw error;

      toast.success("Operación registrada exitosamente");
      form.reset();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Error al registrar operación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar Nueva Operación</CardTitle>
        <CardDescription>Completa los detalles de tu trade</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <FormLabel>Hora de Entrada</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
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
                      <Input type="time" {...field} />
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
                    <FormLabel>Tipo de Operación</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <FormLabel>Resultado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <FormLabel>Modelo de Entrada</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <FormLabel>Resultado ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
              <>
                <FormField
                  control={form.control}
                  name="news_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>¿Cuál noticia?</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: NFP, FOMC..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="execution_timing"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ejecución respecto a la noticia</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona timing" />
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
              </>
            )}

            <FormField
              control={form.control}
              name="image_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link de Imagen (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registrando..." : "Registrar Operación"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
