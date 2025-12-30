import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, addDays, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  AlertTriangle,
  TrendingUp,
  Clock,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ForexEvent {
  time: string;
  currency: string;
  impact: 'high' | 'medium' | 'low';
  event: string;
  forecast: string;
  previous: string;
  actual: string;
}

const ForexCalendar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<ForexEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [rawMarkdown, setRawMarkdown] = useState<string>("");
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchCalendarEvents();
    }
  }, [selectedDate, user]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
  };

  const fetchCalendarEvents = async () => {
    setLoading(true);
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      const { data, error } = await supabase.functions.invoke('forex-calendar', {
        body: { date: formattedDate },
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        setEvents(data.events || []);
        setRawMarkdown(data.rawMarkdown || "");
        if (data.events?.length === 0) {
          toast.info("No se encontraron eventos USD para esta fecha");
        }
      } else {
        throw new Error(data.error || "Error al obtener el calendario");
      }
    } catch (error) {
      console.error("Error fetching calendar:", error);
      toast.error("Error al cargar el calendario económico");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const goToNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-black';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getImpactLabel = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'Alto';
      case 'medium':
        return 'Medio';
      case 'low':
        return 'Bajo';
      default:
        return impact;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-primary" />
            Calendario Económico USD
          </h1>
          <p className="text-muted-foreground mt-2">
            Noticias de alto impacto que afectan al dólar (NFP, GDP, FOMC, CPI, etc.)
          </p>
        </div>

        {/* Date Navigation */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={goToPreviousDay}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="min-w-[200px]">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedDate, "EEEE, d 'de' MMMM yyyy", { locale: es })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Button variant="outline" size="icon" onClick={goToNextDay}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={goToToday}>
                  Hoy
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={fetchCalendarEvents}
                  disabled={loading}
                >
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Impact Legend */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-sm text-muted-foreground">Alto Impacto</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500"></div>
            <span className="text-sm text-muted-foreground">Medio Impacto</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-sm text-muted-foreground">Bajo Impacto</span>
          </div>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-6 w-20 ml-auto" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="space-y-3">
            {events.map((event, index) => (
              <Card 
                key={index} 
                className={cn(
                  "transition-all hover:shadow-md",
                  event.impact === 'high' && "border-l-4 border-l-red-500"
                )}
              >
                <CardContent className="py-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 min-w-[80px]">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm">{event.time}</span>
                    </div>
                    
                    <Badge variant="outline" className="font-bold">
                      {event.currency}
                    </Badge>
                    
                    <Badge className={cn("text-xs", getImpactColor(event.impact))}>
                      {getImpactLabel(event.impact)}
                    </Badge>
                    
                    <span className="font-medium flex-1">{event.event}</span>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {event.forecast !== '-' && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>Prev: {event.forecast}</span>
                        </div>
                      )}
                      {event.previous !== '-' && (
                        <span>Ant: {event.previous}</span>
                      )}
                      {event.actual !== '-' && (
                        <span className="font-bold text-foreground">Act: {event.actual}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No hay eventos USD para esta fecha</h3>
              <p className="text-muted-foreground mt-2">
                Intenta seleccionar otra fecha o verifica que el scraping haya funcionado correctamente.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowRaw(!showRaw)}
              >
                {showRaw ? "Ocultar" : "Ver"} datos raw
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Raw Data Debug */}
        {showRaw && rawMarkdown && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">Datos Raw (Debug)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto max-h-96 bg-muted p-4 rounded">
                {rawMarkdown}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* High Impact Events Summary */}
        {events.filter(e => e.impact === 'high').length > 0 && (
          <Card className="mt-6 border-red-500/50 bg-red-500/5">
            <CardHeader>
              <CardTitle className="text-red-500 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Eventos de Alto Impacto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {events.filter(e => e.impact === 'high').map((event, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-red-500" />
                    <span className="font-mono">{event.time}</span>
                    <span className="font-medium">{event.event}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ForexCalendar;
