-- Create backtest_strategies table
CREATE TABLE public.backtest_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  initial_capital NUMERIC NOT NULL DEFAULT 0,
  risk_reward_ratio TEXT NOT NULL DEFAULT '1:2',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.backtest_strategies ENABLE ROW LEVEL SECURITY;

-- Create policies for backtest_strategies
CREATE POLICY "Users can view their own backtest strategies" 
ON public.backtest_strategies 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own backtest strategies" 
ON public.backtest_strategies 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own backtest strategies" 
ON public.backtest_strategies 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backtest strategies" 
ON public.backtest_strategies 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add strategy_id to backtest_trades
ALTER TABLE public.backtest_trades 
ADD COLUMN strategy_id UUID REFERENCES public.backtest_strategies(id) ON DELETE CASCADE;

-- Create trigger for automatic timestamp updates on backtest_strategies
CREATE TRIGGER update_backtest_strategies_updated_at
BEFORE UPDATE ON public.backtest_strategies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_backtest_trades_strategy_id ON public.backtest_trades(strategy_id);

COMMENT ON TABLE public.backtest_strategies IS 'Stores different backtesting strategies with their configurations';
COMMENT ON COLUMN public.backtest_strategies.risk_reward_ratio IS 'Risk/Reward ratio for the strategy (e.g., "1:2", "1:3", "Variable")';