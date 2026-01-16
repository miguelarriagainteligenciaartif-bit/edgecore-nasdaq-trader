import { BarChart3, FlaskConical, Activity, Save, Layers, Newspaper, ClipboardCheck, Menu, X, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";
import edgecoreLogo from "@/assets/edgecore-logo.png";

interface HeaderProps {
  userName?: string | null;
}

const navItems = [
  { label: "Dashboard", path: "/", icon: null },
  { label: "Análisis", path: "/analytics", icon: null },
  { label: "Equity Curve", path: "/equity-curve", icon: TrendingUp },
  { label: "Backtesting", path: "/backtesting", icon: FlaskConical },
  { label: "X5 Simulator", path: "/edgecore-x5", icon: Activity },
  { label: "Flip Rotacional", path: "/flip-rotational", icon: Layers },
  { label: "Simulaciones", path: "/saved-simulations", icon: Save },
  { label: "Calendario USD", path: "/forex-calendar", icon: Newspaper },
  { label: "Checklist", path: "/checklist", icon: ClipboardCheck },
];

export const Header = ({ userName }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error al cerrar sesión");
    } else {
      toast.success("Sesión cerrada");
      navigate("/auth");
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Main header row */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => navigate("/")}
          >
            <img 
              src={edgecoreLogo} 
              alt="EDGECORE TRADING" 
              className="h-10 w-auto"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                size="sm"
                onClick={() => navigate(item.path)}
                className={cn(
                  "font-medium text-sm transition-colors",
                  isActive(item.path) 
                    ? "text-primary bg-primary/5" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.icon && <item.icon className="mr-1.5 h-4 w-4" />}
                {item.label}
              </Button>
            ))}
          </nav>

          {/* User section */}
          <div className="flex items-center gap-4">
            {userName && (
              <div className="hidden sm:flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {userName}
                </span>
                <Button 
                  onClick={handleSignOut} 
                  variant="outline" 
                  size="sm"
                  className="border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                >
                  Cerrar Sesión
                </Button>
              </div>
            )}
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border animate-fade-in">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    "justify-start font-medium",
                    isActive(item.path) 
                      ? "text-primary bg-primary/5" 
                      : "text-muted-foreground"
                  )}
                >
                  {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                  {item.label}
                </Button>
              ))}
              {userName && (
                <div className="sm:hidden pt-4 mt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2 px-3">{userName}</p>
                  <Button 
                    onClick={handleSignOut} 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                  >
                    Cerrar Sesión
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
