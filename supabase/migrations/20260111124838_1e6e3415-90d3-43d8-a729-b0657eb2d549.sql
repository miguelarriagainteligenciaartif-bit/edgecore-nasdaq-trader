-- Create table for daily checklists
CREATE TABLE public.daily_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  completion_percentage NUMERIC NOT NULL DEFAULT 0,
  
  -- Step 1: Prep
  prep_schedule_clear BOOLEAN DEFAULT NULL,
  prep_30min_available BOOLEAN DEFAULT NULL,
  
  -- Step 2: Monthly
  monthly_previous_month TEXT DEFAULT NULL, -- bullish, bearish, ranging
  monthly_fvg_count INTEGER DEFAULT NULL,
  monthly_current_price_location TEXT DEFAULT NULL, -- premium, discount, equilibrium
  
  -- Step 3: Weekly
  weekly_previous_week TEXT DEFAULT NULL, -- bullish, bearish, ranging
  weekly_fvg_count INTEGER DEFAULT NULL,
  weekly_current_price_location TEXT DEFAULT NULL,
  
  -- Step 4: Daily
  daily_yesterday TEXT DEFAULT NULL, -- bullish, bearish, ranging
  daily_fvg_count INTEGER DEFAULT NULL,
  daily_current_price_location TEXT DEFAULT NULL,
  
  -- Step 5: 4H
  h4_context TEXT DEFAULT NULL, -- bullish, bearish, ranging
  h4_fvg_count INTEGER DEFAULT NULL,
  h4_price_location TEXT DEFAULT NULL,
  
  -- Step 6: 1H
  h1_context TEXT DEFAULT NULL,
  h1_fvg_count INTEGER DEFAULT NULL,
  h1_poi_identified BOOLEAN DEFAULT NULL,
  
  -- Step 7: Entry Decision
  entry_conditions_met BOOLEAN DEFAULT NULL,
  no_trade_reason TEXT DEFAULT NULL, -- if entry_conditions_met is false
  
  -- Step 8: Execution Log
  executed_entry BOOLEAN DEFAULT NULL,
  
  -- Metadata
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, date)
);

-- Create table for entries (1-3 per checklist)
CREATE TABLE public.checklist_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL REFERENCES public.daily_checklists(id) ON DELETE CASCADE,
  entry_number INTEGER NOT NULL CHECK (entry_number BETWEEN 1 AND 3),
  entry_model TEXT NOT NULL CHECK (entry_model IN ('M1', 'M3', 'Continuación')),
  result TEXT DEFAULT NULL CHECK (result IS NULL OR result IN ('TP', 'SL')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(checklist_id, entry_number)
);

-- Enable RLS
ALTER TABLE public.daily_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_entries ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_checklists
CREATE POLICY "Users can view their own checklists" 
ON public.daily_checklists FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own checklists" 
ON public.daily_checklists FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checklists" 
ON public.daily_checklists FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checklists" 
ON public.daily_checklists FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for checklist_entries
CREATE POLICY "Users can view their own checklist entries" 
ON public.checklist_entries FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.daily_checklists 
  WHERE id = checklist_entries.checklist_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can create their own checklist entries" 
ON public.checklist_entries FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.daily_checklists 
  WHERE id = checklist_entries.checklist_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can update their own checklist entries" 
ON public.checklist_entries FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.daily_checklists 
  WHERE id = checklist_entries.checklist_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can delete their own checklist entries" 
ON public.checklist_entries FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.daily_checklists 
  WHERE id = checklist_entries.checklist_id 
  AND user_id = auth.uid()
));

-- Trigger for updated_at
CREATE TRIGGER update_daily_checklists_updated_at
BEFORE UPDATE ON public.daily_checklists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();