import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedEvent {
  date: string;
  time: string;
  currency: string;
  impact: 'high' | 'medium' | 'low';
  event: string;
  forecast: string | null;
  previous: string | null;
  actual: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current week's calendar from Forex Factory
    const today = new Date();
    const weekStart = getMonday(today);
    
    // Format date for Forex Factory URL (e.g., jan6.2026-jan12.2026)
    const startStr = formatFFDate(weekStart);
    const endDate = new Date(weekStart);
    endDate.setDate(endDate.getDate() + 6);
    const endStr = formatFFDate(endDate);
    
    const calendarUrl = `https://www.forexfactory.com/calendar?week=${startStr}-${endStr}`;
    
    console.log('Scraping Forex Factory:', calendarUrl);

    // Use Firecrawl to scrape the calendar
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: calendarUrl,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 3000, // Wait for dynamic content to load
      }),
    });

    if (!scrapeResponse.ok) {
      const errorData = await scrapeResponse.json();
      console.error('Firecrawl error:', errorData);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to scrape Forex Factory' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scrapeData = await scrapeResponse.json();
    const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
    const html = scrapeData.data?.html || scrapeData.html || '';
    
    console.log('Scraped content length:', markdown.length);

    // Parse the calendar data
    const events = parseForexFactoryData(markdown, html, weekStart);
    
    // Filter for USD only, high and medium impact
    const filteredEvents = events.filter(e => 
      e.currency === 'USD' && 
      (e.impact === 'high' || e.impact === 'medium')
    );

    console.log(`Parsed ${events.length} total events, ${filteredEvents.length} USD high/medium impact`);

    if (filteredEvents.length > 0) {
      // Get date range for deletion
      const dates = filteredEvents.map(e => e.date);
      const minDate = dates.reduce((a, b) => a < b ? a : b);
      const maxDate = dates.reduce((a, b) => a > b ? a : b);

      // Delete existing events in the date range for USD
      const { error: deleteError } = await supabase
        .from('economic_events')
        .delete()
        .eq('currency', 'USD')
        .gte('event_date', minDate)
        .lte('event_date', maxDate);

      if (deleteError) {
        console.error('Delete error:', deleteError);
      }

      // Insert new events
      const eventsToInsert = filteredEvents.map(e => ({
        event_date: e.date,
        event_time: e.time || '08:30:00',
        currency: e.currency,
        impact: e.impact,
        event_name: e.event,
        forecast: e.forecast,
        previous: e.previous,
        actual: e.actual,
      }));

      const { error: insertError } = await supabase
        .from('economic_events')
        .insert(eventsToInsert);

      if (insertError) {
        console.error('Insert error:', insertError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to save events' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced ${filteredEvents.length} USD high/medium impact events`,
        events: filteredEvents,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Sync failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function formatFFDate(date: Date): string {
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  return `${months[date.getMonth()]}${date.getDate()}.${date.getFullYear()}`;
}

function parseForexFactoryData(markdown: string, html: string, weekStart: Date): ParsedEvent[] {
  const events: ParsedEvent[] = [];
  
  // Try to parse from markdown first
  const lines = markdown.split('\n');
  let currentDate = '';
  let currentYear = weekStart.getFullYear();
  
  // Common patterns in Forex Factory markdown
  // Date lines like "Mon Jan 6" or "**Monday January 6**"
  const datePatterns = [
    /(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})/i,
    /\*\*(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\*\*/i,
  ];
  
  // Event patterns - looking for currency, impact indicators, and event names
  // High impact often marked with 🔴 or "High" or bold
  // Medium impact with 🟠 or "Medium"
  const eventPattern = /\b(USD|EUR|GBP|JPY|CAD|AUD|NZD|CHF)\b.*?(High|Medium|Low|🔴|🟠|🟡)/i;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check for date headers
    for (const pattern of datePatterns) {
      const dateMatch = line.match(pattern);
      if (dateMatch) {
        const monthStr = dateMatch[1].toLowerCase().slice(0, 3);
        const day = parseInt(dateMatch[2]);
        const monthIndex = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(monthStr);
        if (monthIndex !== -1) {
          currentDate = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
        break;
      }
    }
    
    // Check for events
    if (currentDate && line.includes('USD')) {
      const impactMatch = line.match(/(?:High|🔴)/i) ? 'high' : 
                          line.match(/(?:Medium|🟠)/i) ? 'medium' : 
                          line.match(/(?:Low|🟡)/i) ? 'low' : null;
      
      if (impactMatch) {
        // Extract time (patterns like "8:30am", "10:00 AM")
        const timeMatch = line.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
        let eventTime = '08:30:00';
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = timeMatch[2];
          const ampm = timeMatch[3]?.toLowerCase();
          if (ampm === 'pm' && hours < 12) hours += 12;
          if (ampm === 'am' && hours === 12) hours = 0;
          eventTime = `${String(hours).padStart(2, '0')}:${minutes}:00`;
        }
        
        // Try to extract event name - usually the longest text segment
        // Remove time, currency, impact indicators
        let eventName = line
          .replace(/\d{1,2}:\d{2}\s*(am|pm)?/gi, '')
          .replace(/\b(USD|EUR|GBP|JPY|CAD|AUD|NZD|CHF)\b/gi, '')
          .replace(/\b(High|Medium|Low)\b/gi, '')
          .replace(/[🔴🟠🟡⚫]/g, '')
          .replace(/\*\*/g, '')
          .replace(/\|/g, '')
          .trim();
        
        // Clean up multiple spaces
        eventName = eventName.replace(/\s+/g, ' ').trim();
        
        // Skip if event name is too short or empty
        if (eventName.length > 3) {
          events.push({
            date: currentDate,
            time: eventTime,
            currency: 'USD',
            impact: impactMatch as 'high' | 'medium' | 'low',
            event: eventName,
            forecast: null,
            previous: null,
            actual: null,
          });
        }
      }
    }
  }
  
  // If no events found from markdown, try HTML parsing
  if (events.length === 0 && html) {
    console.log('No events from markdown, attempting HTML parse');
    // HTML parsing would go here - but markdown is usually more reliable
  }
  
  // Deduplicate events by date + time + event name
  const seen = new Set<string>();
  return events.filter(e => {
    const key = `${e.date}-${e.time}-${e.event}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
