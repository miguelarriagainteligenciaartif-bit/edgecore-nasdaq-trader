import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EconomicEvent {
  time: string;
  currency: string;
  impact: 'high' | 'medium' | 'low';
  event: string;
  forecast: string;
  previous: string;
  actual: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { date } = await req.json();
    
    if (!date) {
      return new Response(
        JSON.stringify({ success: false, error: 'Date is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching economic calendar for:', date);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query events from database
    const { data: dbEvents, error: dbError } = await supabase
      .from('economic_events')
      .select('*')
      .eq('event_date', date)
      .order('event_time', { ascending: true });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Error fetching events from database');
    }

    console.log(`Found ${dbEvents?.length || 0} events in database for ${date}`);

    // Transform database events to API format
    const events: EconomicEvent[] = (dbEvents || []).map(event => ({
      time: formatTime(event.event_time),
      currency: event.currency,
      impact: event.impact as 'high' | 'medium' | 'low',
      event: event.event_name,
      forecast: event.forecast || '-',
      previous: event.previous || '-',
      actual: event.actual || '-'
    }));

    // Sort by impact (high first) then by time
    const impactOrder = { high: 0, medium: 1, low: 2 };
    events.sort((a, b) => {
      const impactDiff = impactOrder[a.impact] - impactOrder[b.impact];
      if (impactDiff !== 0) return impactDiff;
      return a.time.localeCompare(b.time);
    });

    console.log(`Returning ${events.length} events for ${date}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        events,
        date,
        source: 'database'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch calendar';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Format time from HH:MM:SS to HH:MM AM/PM
function formatTime(timeStr: string): string {
  if (!timeStr) return 'All Day';
  
  const [hours, minutes] = timeStr.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}
