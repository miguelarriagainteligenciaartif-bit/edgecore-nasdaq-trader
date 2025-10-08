-- Add week_of_month column to trades table
ALTER TABLE public.trades 
ADD COLUMN week_of_month integer;

-- Add check constraint to ensure week_of_month is between 1 and 5
ALTER TABLE public.trades
ADD CONSTRAINT week_of_month_check CHECK (week_of_month >= 1 AND week_of_month <= 5);

-- Delete all existing trades
DELETE FROM public.trades;