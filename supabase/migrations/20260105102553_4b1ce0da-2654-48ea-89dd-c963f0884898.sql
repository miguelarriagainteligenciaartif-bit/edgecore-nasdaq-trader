-- Add RLS policies for authenticated users to manage economic events
CREATE POLICY "Authenticated users can insert economic events"
ON public.economic_events
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update economic events"
ON public.economic_events
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete economic events"
ON public.economic_events
FOR DELETE
TO authenticated
USING (true);