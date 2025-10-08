-- Create backtest_trades table for historical strategy testing
CREATE TABLE public.backtest_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  day_of_week TEXT NOT NULL,
  week_of_month INTEGER,
  entry_time TIME WITHOUT TIME ZONE NOT NULL,
  exit_time TIME WITHOUT TIME ZONE,
  entry_model TEXT NOT NULL,
  trade_type TEXT NOT NULL,
  result_type TEXT NOT NULL,
  result_dollars NUMERIC NOT NULL,
  had_news BOOLEAN DEFAULT false,
  news_time TIME WITHOUT TIME ZONE,
  news_description TEXT,
  custom_news_description TEXT,
  execution_timing TEXT,
  no_trade_day BOOLEAN DEFAULT false,
  image_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.backtest_trades ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own backtest trades" 
ON public.backtest_trades 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own backtest trades" 
ON public.backtest_trades 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own backtest trades" 
ON public.backtest_trades 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backtest trades" 
ON public.backtest_trades 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_backtest_trades_updated_at
BEFORE UPDATE ON public.backtest_trades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();