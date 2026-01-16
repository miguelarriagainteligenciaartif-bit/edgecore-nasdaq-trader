import { FlaskConical, Activity, Save, Layers, Newspaper, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import edgecoreLogo from "@/assets/edgecore-logo.png";

interface HeaderProps {
  userName?: string | null;
}

export const Header = ({ userName }: HeaderProps) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error al cerrar sesión");
    } else {
      toast.success("Sesión cerrada");
      navigate("/auth");
    }
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
              <img 
                src={edgecoreLogo} 
                alt="EdgeCore Trading Logo" 
                className="h-10 sm:h-12 md:h-14 w-auto"
              />
            </div>
            
            <nav className="hidden md:flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/")}
              >
                Dashboard
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/analytics")}
              >
                Análisis
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/equity-curve")}
              >
                Equity Curve
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/backtesting")}
              >
                <FlaskConical className="mr-2 h-4 w-4" />
                Backtesting
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/edgecore-x5")}
              >
                <Activity className="mr-2 h-4 w-4" />
                X5 Simulator
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/flip-rotational")}
              >
                <Layers className="mr-2 h-4 w-4" />
                Flip Rotacional
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/saved-simulations")}
              >
                <Save className="mr-2 h-4 w-4" />
                Simulaciones
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/forex-calendar")}
              >
                <Newspaper className="mr-2 h-4 w-4" />
                Calendario USD
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/checklist")}
              >
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Checklist
              </Button>
            </nav>
          </div>
          
          {userName && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Hola, {userName}</span>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                Cerrar Sesión
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
