import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown } from "lucide-react";

interface ChecklistRecord {
  id: string;
  date: string;
  completion_percentage: number;
  entry_conditions_met: boolean | null;
  executed_entry: boolean | null;
  is_completed: boolean;
  entries: Array<{
    entry_model: string;
    result: string | null;
  }>;
}

export const ChecklistHistory = () => {
  const [checklists, setChecklists] = useState<ChecklistRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChecklists();
  }, []);

  const loadChecklists = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('daily_checklists')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(50);

    if (data && !error) {
      // Fetch entries for each checklist
      const checklistsWithEntries = await Promise.all(
        data.map(async (checklist) => {
          const { data: entries } = await supabase
            .from('checklist_entries')
            .select('entry_model, result')
            .eq('checklist_id', checklist.id);
          
          return {
            ...checklist,
            entries: entries || [],
          };
        })
      );
      setChecklists(checklistsWithEntries);
    }
    setLoading(false);
  };

  const getResultSummary = (entries: ChecklistRecord['entries']) => {
    if (entries.length === 0) return null;
    const tps = entries.filter(e => e.result === 'TP').length;
    const sls = entries.filter(e => e.result === 'SL').length;
    const pending = entries.filter(e => e.result === null).length;
    return { tps, sls, pending, total: entries.length };
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Historial de Operaciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        {checklists.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay checklists registrados aún.
          </p>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {checklists.map((checklist) => {
                const resultSummary = getResultSummary(checklist.entries);
                const formattedDate = format(new Date(checklist.date), "EEEE, d 'de' MMMM yyyy", { locale: es });

                return (
                  <Card key={checklist.id} className="bg-secondary/30 border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <p className="font-medium capitalize">{formattedDate}</p>
                          
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={checklist.completion_percentage === 100 ? "default" : "secondary"}
                              className={checklist.completion_percentage === 100 ? "bg-success" : ""}
                            >
                              {checklist.completion_percentage}% completado
                            </Badge>
                            
                            {checklist.entry_conditions_met === true && (
                              <Badge variant="outline" className="border-success text-success">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Condiciones OK
                              </Badge>
                            )}
                            {checklist.entry_conditions_met === false && (
                              <Badge variant="outline" className="border-destructive text-destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                No operó
                              </Badge>
                            )}
                          </div>

                          {resultSummary && (
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-muted-foreground">
                                {resultSummary.total} entrada{resultSummary.total > 1 ? 's' : ''}:
                              </span>
                              {resultSummary.tps > 0 && (
                                <span className="flex items-center gap-1 text-success">
                                  <TrendingUp className="h-3 w-3" />
                                  {resultSummary.tps} TP
                                </span>
                              )}
                              {resultSummary.sls > 0 && (
                                <span className="flex items-center gap-1 text-destructive">
                                  <TrendingDown className="h-3 w-3" />
                                  {resultSummary.sls} SL
                                </span>
                              )}
                              {resultSummary.pending > 0 && (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {resultSummary.pending} pendiente
                                </span>
                              )}
                            </div>
                          )}

                          {checklist.entries.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                              {checklist.entries.map((entry, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className={
                                    entry.result === 'TP'
                                      ? 'border-success text-success'
                                      : entry.result === 'SL'
                                      ? 'border-destructive text-destructive'
                                      : 'border-muted-foreground text-muted-foreground'
                                  }
                                >
                                  {entry.entry_model}: {entry.result || 'Pendiente'}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
