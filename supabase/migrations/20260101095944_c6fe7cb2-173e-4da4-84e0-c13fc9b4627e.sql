-- Create economic_events table for reliable calendar data
CREATE TABLE public.economic_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL DEFAULT '08:30:00',
  event_name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  impact TEXT NOT NULL DEFAULT 'high',
  forecast TEXT,
  previous TEXT,
  actual TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.economic_events ENABLE ROW LEVEL SECURITY;

-- Public read access (calendar is public info)
CREATE POLICY "Economic events are publicly viewable" 
ON public.economic_events 
FOR SELECT 
USING (true);

-- Create index for date queries
CREATE INDEX idx_economic_events_date ON public.economic_events(event_date);

-- Insert 2026 economic events
-- NFP (First Friday of each month)
INSERT INTO public.economic_events (event_date, event_time, event_name, impact) VALUES
('2026-01-02', '08:30:00', 'Non-Farm Payrolls (NFP)', 'high'),
('2026-01-02', '08:30:00', 'Unemployment Rate', 'high'),
('2026-02-06', '08:30:00', 'Non-Farm Payrolls (NFP)', 'high'),
('2026-02-06', '08:30:00', 'Unemployment Rate', 'high'),
('2026-03-06', '08:30:00', 'Non-Farm Payrolls (NFP)', 'high'),
('2026-03-06', '08:30:00', 'Unemployment Rate', 'high'),
('2026-04-03', '08:30:00', 'Non-Farm Payrolls (NFP)', 'high'),
('2026-04-03', '08:30:00', 'Unemployment Rate', 'high'),
('2026-05-01', '08:30:00', 'Non-Farm Payrolls (NFP)', 'high'),
('2026-05-01', '08:30:00', 'Unemployment Rate', 'high'),
('2026-06-05', '08:30:00', 'Non-Farm Payrolls (NFP)', 'high'),
('2026-06-05', '08:30:00', 'Unemployment Rate', 'high'),
('2026-07-02', '08:30:00', 'Non-Farm Payrolls (NFP)', 'high'),
('2026-07-02', '08:30:00', 'Unemployment Rate', 'high'),
('2026-08-07', '08:30:00', 'Non-Farm Payrolls (NFP)', 'high'),
('2026-08-07', '08:30:00', 'Unemployment Rate', 'high'),
('2026-09-04', '08:30:00', 'Non-Farm Payrolls (NFP)', 'high'),
('2026-09-04', '08:30:00', 'Unemployment Rate', 'high'),
('2026-10-02', '08:30:00', 'Non-Farm Payrolls (NFP)', 'high'),
('2026-10-02', '08:30:00', 'Unemployment Rate', 'high'),
('2026-11-06', '08:30:00', 'Non-Farm Payrolls (NFP)', 'high'),
('2026-11-06', '08:30:00', 'Unemployment Rate', 'high'),
('2026-12-04', '08:30:00', 'Non-Farm Payrolls (NFP)', 'high'),
('2026-12-04', '08:30:00', 'Unemployment Rate', 'high');

-- CPI (Usually mid-month, around 13th-14th)
INSERT INTO public.economic_events (event_date, event_time, event_name, impact) VALUES
('2026-01-14', '08:30:00', 'Consumer Price Index (CPI)', 'high'),
('2026-01-14', '08:30:00', 'Core CPI m/m', 'high'),
('2026-02-11', '08:30:00', 'Consumer Price Index (CPI)', 'high'),
('2026-02-11', '08:30:00', 'Core CPI m/m', 'high'),
('2026-03-11', '08:30:00', 'Consumer Price Index (CPI)', 'high'),
('2026-03-11', '08:30:00', 'Core CPI m/m', 'high'),
('2026-04-14', '08:30:00', 'Consumer Price Index (CPI)', 'high'),
('2026-04-14', '08:30:00', 'Core CPI m/m', 'high'),
('2026-05-13', '08:30:00', 'Consumer Price Index (CPI)', 'high'),
('2026-05-13', '08:30:00', 'Core CPI m/m', 'high'),
('2026-06-10', '08:30:00', 'Consumer Price Index (CPI)', 'high'),
('2026-06-10', '08:30:00', 'Core CPI m/m', 'high'),
('2026-07-14', '08:30:00', 'Consumer Price Index (CPI)', 'high'),
('2026-07-14', '08:30:00', 'Core CPI m/m', 'high'),
('2026-08-12', '08:30:00', 'Consumer Price Index (CPI)', 'high'),
('2026-08-12', '08:30:00', 'Core CPI m/m', 'high'),
('2026-09-15', '08:30:00', 'Consumer Price Index (CPI)', 'high'),
('2026-09-15', '08:30:00', 'Core CPI m/m', 'high'),
('2026-10-13', '08:30:00', 'Consumer Price Index (CPI)', 'high'),
('2026-10-13', '08:30:00', 'Core CPI m/m', 'high'),
('2026-11-12', '08:30:00', 'Consumer Price Index (CPI)', 'high'),
('2026-11-12', '08:30:00', 'Core CPI m/m', 'high'),
('2026-12-10', '08:30:00', 'Consumer Price Index (CPI)', 'high'),
('2026-12-10', '08:30:00', 'Core CPI m/m', 'high');

-- FOMC Meetings 2026 (8 meetings per year)
INSERT INTO public.economic_events (event_date, event_time, event_name, impact) VALUES
('2026-01-28', '14:00:00', 'FOMC Statement & Interest Rate Decision', 'high'),
('2026-01-28', '14:30:00', 'FOMC Press Conference', 'high'),
('2026-03-18', '14:00:00', 'FOMC Statement & Interest Rate Decision', 'high'),
('2026-03-18', '14:30:00', 'FOMC Press Conference', 'high'),
('2026-05-06', '14:00:00', 'FOMC Statement & Interest Rate Decision', 'high'),
('2026-05-06', '14:30:00', 'FOMC Press Conference', 'high'),
('2026-06-17', '14:00:00', 'FOMC Statement & Interest Rate Decision', 'high'),
('2026-06-17', '14:30:00', 'FOMC Press Conference', 'high'),
('2026-07-29', '14:00:00', 'FOMC Statement & Interest Rate Decision', 'high'),
('2026-07-29', '14:30:00', 'FOMC Press Conference', 'high'),
('2026-09-16', '14:00:00', 'FOMC Statement & Interest Rate Decision', 'high'),
('2026-09-16', '14:30:00', 'FOMC Press Conference', 'high'),
('2026-11-04', '14:00:00', 'FOMC Statement & Interest Rate Decision', 'high'),
('2026-11-04', '14:30:00', 'FOMC Press Conference', 'high'),
('2026-12-16', '14:00:00', 'FOMC Statement & Interest Rate Decision', 'high'),
('2026-12-16', '14:30:00', 'FOMC Press Conference', 'high');

-- GDP (End of month, quarterly)
INSERT INTO public.economic_events (event_date, event_time, event_name, impact) VALUES
('2026-01-29', '08:30:00', 'GDP q/q (Advance)', 'high'),
('2026-04-29', '08:30:00', 'GDP q/q (Advance)', 'high'),
('2026-07-30', '08:30:00', 'GDP q/q (Advance)', 'high'),
('2026-10-29', '08:30:00', 'GDP q/q (Advance)', 'high');

-- Initial Jobless Claims (Every Thursday)
INSERT INTO public.economic_events (event_date, event_time, event_name, impact) 
SELECT 
  d::date,
  '08:30:00'::time,
  'Initial Jobless Claims',
  'medium'
FROM generate_series('2026-01-01'::date, '2026-12-31'::date, '1 day'::interval) d
WHERE EXTRACT(DOW FROM d) = 4;

-- Core PCE (Last Friday of month - Fed's preferred inflation measure)
INSERT INTO public.economic_events (event_date, event_time, event_name, impact) VALUES
('2026-01-30', '08:30:00', 'Core PCE Price Index m/m', 'high'),
('2026-02-27', '08:30:00', 'Core PCE Price Index m/m', 'high'),
('2026-03-27', '08:30:00', 'Core PCE Price Index m/m', 'high'),
('2026-04-30', '08:30:00', 'Core PCE Price Index m/m', 'high'),
('2026-05-29', '08:30:00', 'Core PCE Price Index m/m', 'high'),
('2026-06-26', '08:30:00', 'Core PCE Price Index m/m', 'high'),
('2026-07-31', '08:30:00', 'Core PCE Price Index m/m', 'high'),
('2026-08-28', '08:30:00', 'Core PCE Price Index m/m', 'high'),
('2026-09-25', '08:30:00', 'Core PCE Price Index m/m', 'high'),
('2026-10-30', '08:30:00', 'Core PCE Price Index m/m', 'high'),
('2026-11-25', '08:30:00', 'Core PCE Price Index m/m', 'high'),
('2026-12-23', '08:30:00', 'Core PCE Price Index m/m', 'high');

-- Retail Sales (Mid-month)
INSERT INTO public.economic_events (event_date, event_time, event_name, impact) VALUES
('2026-01-16', '08:30:00', 'Retail Sales m/m', 'high'),
('2026-02-13', '08:30:00', 'Retail Sales m/m', 'high'),
('2026-03-17', '08:30:00', 'Retail Sales m/m', 'high'),
('2026-04-15', '08:30:00', 'Retail Sales m/m', 'high'),
('2026-05-15', '08:30:00', 'Retail Sales m/m', 'high'),
('2026-06-16', '08:30:00', 'Retail Sales m/m', 'high'),
('2026-07-16', '08:30:00', 'Retail Sales m/m', 'high'),
('2026-08-14', '08:30:00', 'Retail Sales m/m', 'high'),
('2026-09-16', '08:30:00', 'Retail Sales m/m', 'high'),
('2026-10-16', '08:30:00', 'Retail Sales m/m', 'high'),
('2026-11-17', '08:30:00', 'Retail Sales m/m', 'high'),
('2026-12-15', '08:30:00', 'Retail Sales m/m', 'high');

-- ISM Manufacturing PMI (First business day of month)
INSERT INTO public.economic_events (event_date, event_time, event_name, impact) VALUES
('2026-01-02', '10:00:00', 'ISM Manufacturing PMI', 'high'),
('2026-02-02', '10:00:00', 'ISM Manufacturing PMI', 'high'),
('2026-03-02', '10:00:00', 'ISM Manufacturing PMI', 'high'),
('2026-04-01', '10:00:00', 'ISM Manufacturing PMI', 'high'),
('2026-05-01', '10:00:00', 'ISM Manufacturing PMI', 'high'),
('2026-06-01', '10:00:00', 'ISM Manufacturing PMI', 'high'),
('2026-07-01', '10:00:00', 'ISM Manufacturing PMI', 'high'),
('2026-08-03', '10:00:00', 'ISM Manufacturing PMI', 'high'),
('2026-09-01', '10:00:00', 'ISM Manufacturing PMI', 'high'),
('2026-10-01', '10:00:00', 'ISM Manufacturing PMI', 'high'),
('2026-11-02', '10:00:00', 'ISM Manufacturing PMI', 'high'),
('2026-12-01', '10:00:00', 'ISM Manufacturing PMI', 'high');

-- ISM Services PMI (Third business day of month)
INSERT INTO public.economic_events (event_date, event_time, event_name, impact) VALUES
('2026-01-06', '10:00:00', 'ISM Services PMI', 'high'),
('2026-02-04', '10:00:00', 'ISM Services PMI', 'high'),
('2026-03-04', '10:00:00', 'ISM Services PMI', 'high'),
('2026-04-03', '10:00:00', 'ISM Services PMI', 'high'),
('2026-05-05', '10:00:00', 'ISM Services PMI', 'high'),
('2026-06-03', '10:00:00', 'ISM Services PMI', 'high'),
('2026-07-06', '10:00:00', 'ISM Services PMI', 'high'),
('2026-08-05', '10:00:00', 'ISM Services PMI', 'high'),
('2026-09-03', '10:00:00', 'ISM Services PMI', 'high'),
('2026-10-05', '10:00:00', 'ISM Services PMI', 'high'),
('2026-11-04', '10:00:00', 'ISM Services PMI', 'high'),
('2026-12-03', '10:00:00', 'ISM Services PMI', 'high');