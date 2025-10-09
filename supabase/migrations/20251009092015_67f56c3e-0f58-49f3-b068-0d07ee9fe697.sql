-- Add risk_percentage column to trades table
ALTER TABLE public.trades 
ADD COLUMN risk_percentage numeric DEFAULT 1 NOT NULL;

COMMENT ON COLUMN public.trades.risk_percentage IS 'Percentage of risk used in this specific trade';