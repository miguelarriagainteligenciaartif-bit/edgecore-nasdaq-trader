-- Add drawdown column to trades table
ALTER TABLE public.trades
ADD COLUMN drawdown numeric;

-- Add drawdown column to backtest_trades table
ALTER TABLE public.backtest_trades
ADD COLUMN drawdown numeric;

-- Add comment to explain the column
COMMENT ON COLUMN public.trades.drawdown IS 'DrawDown recorrido en la operación: 0.33, 0.50, 0.66, 0.90, o 1.00 (Full/SL)';
COMMENT ON COLUMN public.backtest_trades.drawdown IS 'DrawDown recorrido en la operación: 0.33, 0.50, 0.66, 0.90, o 1.00 (Full/SL)';