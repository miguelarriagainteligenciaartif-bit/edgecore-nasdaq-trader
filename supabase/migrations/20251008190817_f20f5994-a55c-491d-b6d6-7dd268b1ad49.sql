-- Create trades table
CREATE TABLE public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes')),
  entry_time TIME NOT NULL,
  exit_time TIME,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('Compra', 'Venta')),
  result_type TEXT NOT NULL CHECK (result_type IN ('TP', 'SL')),
  had_news BOOLEAN DEFAULT FALSE,
  news_description TEXT,
  execution_timing TEXT CHECK (execution_timing IN ('Antes de noticia', 'Después de noticia')),
  entry_model TEXT NOT NULL CHECK (entry_model IN ('M1', 'M3', 'Continuación')),
  result_dollars DECIMAL(10, 2) NOT NULL,
  image_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trades
CREATE POLICY "Users can view their own trades"
  ON public.trades
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades"
  ON public.trades
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades"
  ON public.trades
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades"
  ON public.trades
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trades_updated_at
  BEFORE UPDATE ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_trades_user_date ON public.trades(user_id, date DESC);
CREATE INDEX idx_trades_entry_model ON public.trades(entry_model);
CREATE INDEX idx_trades_day_of_week ON public.trades(day_of_week);