-- Create table for group rotational simulations
CREATE TABLE public.group_rotational_simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Nueva Simulación Rotacional',
  config JSONB NOT NULL,
  state JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.group_rotational_simulations ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own group rotational simulations" 
ON public.group_rotational_simulations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own group rotational simulations" 
ON public.group_rotational_simulations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own group rotational simulations" 
ON public.group_rotational_simulations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own group rotational simulations" 
ON public.group_rotational_simulations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_group_rotational_simulations_updated_at
BEFORE UPDATE ON public.group_rotational_simulations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();