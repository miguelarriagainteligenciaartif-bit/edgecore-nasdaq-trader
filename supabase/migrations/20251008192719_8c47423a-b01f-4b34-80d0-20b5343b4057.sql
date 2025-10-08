-- Add new columns for news time and no-trade days
ALTER TABLE public.trades
ADD COLUMN news_time time without time zone,
ADD COLUMN no_trade_day boolean DEFAULT false;

-- Update the had_news column to allow null for no-trade days
COMMENT ON COLUMN public.trades.no_trade_day IS 'Indicates if this was a day with no trading activity';
COMMENT ON COLUMN public.trades.news_time IS 'Time of the news event in NY timezone (8:30, 9:45, 10:00 AM)';