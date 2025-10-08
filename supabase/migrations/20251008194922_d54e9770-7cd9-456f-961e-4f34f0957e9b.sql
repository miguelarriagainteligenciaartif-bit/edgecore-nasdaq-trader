-- Add column for custom news description when user selects "Otra"
ALTER TABLE public.trades
ADD COLUMN custom_news_description text;

COMMENT ON COLUMN public.trades.custom_news_description IS 'Custom news description when user selects "Otra" in news_description';