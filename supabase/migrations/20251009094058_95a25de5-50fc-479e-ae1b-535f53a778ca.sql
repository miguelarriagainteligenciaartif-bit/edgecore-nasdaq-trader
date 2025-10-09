-- Add risk_percentage column to backtest_trades table
ALTER TABLE public.backtest_trades 
ADD COLUMN risk_percentage numeric NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.backtest_trades.risk_percentage IS 'Percentage of risk used in this specific backtest trade';