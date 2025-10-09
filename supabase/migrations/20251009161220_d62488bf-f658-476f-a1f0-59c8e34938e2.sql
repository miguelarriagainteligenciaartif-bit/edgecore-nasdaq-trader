-- Add max_rr column to trades table
ALTER TABLE public.trades ADD COLUMN max_rr numeric;

-- Add max_rr column to backtest_trades table
ALTER TABLE public.backtest_trades ADD COLUMN max_rr numeric;