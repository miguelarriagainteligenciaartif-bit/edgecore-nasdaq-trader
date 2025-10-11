-- Tabla para guardar simulaciones
CREATE TABLE flip_simulations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Nueva Simulación',
  account_size NUMERIC NOT NULL DEFAULT 1000,
  cycle_size INTEGER NOT NULL DEFAULT 2,
  risk_per_cycle NUMERIC NOT NULL DEFAULT 200,
  rr_ratio NUMERIC NOT NULL DEFAULT 2.0,
  reinvest_percent NUMERIC NOT NULL DEFAULT 80,
  trade_results TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE flip_simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own simulations"
  ON flip_simulations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own simulations"
  ON flip_simulations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own simulations"
  ON flip_simulations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own simulations"
  ON flip_simulations FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_flip_simulations_updated_at
  BEFORE UPDATE ON flip_simulations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();