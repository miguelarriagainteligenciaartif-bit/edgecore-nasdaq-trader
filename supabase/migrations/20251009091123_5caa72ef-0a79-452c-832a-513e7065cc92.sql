-- Crear tabla para configuración de backtesting
CREATE TABLE IF NOT EXISTS public.backtest_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  initial_capital NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.backtest_config ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own backtest config"
  ON public.backtest_config
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own backtest config"
  ON public.backtest_config
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own backtest config"
  ON public.backtest_config
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_backtest_config_updated_at
  BEFORE UPDATE ON public.backtest_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();