-- Add asset field to trades table
ALTER TABLE public.trades 
ADD COLUMN asset text NOT NULL DEFAULT 'Nasdaq 100';

-- Add asset field to backtest_trades table
ALTER TABLE public.backtest_trades 
ADD COLUMN asset text NOT NULL DEFAULT 'Nasdaq 100';

-- Add asset field to backtest_strategies table for default asset
ALTER TABLE public.backtest_strategies 
ADD COLUMN asset text NOT NULL DEFAULT 'Nasdaq 100';