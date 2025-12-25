-- Prevent inserting/updating trades with a future date (server-side validation)

CREATE OR REPLACE FUNCTION public.prevent_future_trade_date()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.date > (now() AT TIME ZONE 'utc')::date THEN
    RAISE EXCEPTION 'La fecha no puede ser futura.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_future_trade_date_trades ON public.trades;
CREATE TRIGGER trg_prevent_future_trade_date_trades
BEFORE INSERT OR UPDATE ON public.trades
FOR EACH ROW
EXECUTE FUNCTION public.prevent_future_trade_date();

DROP TRIGGER IF EXISTS trg_prevent_future_trade_date_backtest_trades ON public.backtest_trades;
CREATE TRIGGER trg_prevent_future_trade_date_backtest_trades
BEFORE INSERT OR UPDATE ON public.backtest_trades
FOR EACH ROW
EXECUTE FUNCTION public.prevent_future_trade_date();
