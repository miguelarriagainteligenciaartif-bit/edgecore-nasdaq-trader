const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ForexEvent {
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

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format date for Forex Factory URL (e.g., jan2.2024)
    const dateObj = new Date(date);
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const month = months[dateObj.getMonth()];
    const day = dateObj.getDate();
    const year = dateObj.getFullYear();
    const forexFactoryDate = `${month}${day}.${year}`;
    
    const url = `https://www.forexfactory.com/calendar?day=${forexFactoryDate}`;
    
    console.log('Scraping Forex Factory:', url);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || 'Failed to scrape' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the scraped content to extract USD events
    const events = parseForexEvents(data.data?.markdown || data.markdown || '', date);
    
    console.log(`Found ${events.length} USD events for ${date}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        events,
        rawMarkdown: data.data?.markdown || data.markdown,
        date 
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

function parseForexEvents(markdown: string, date: string): ForexEvent[] {
  const events: ForexEvent[] = [];
  
  // Common USD high-impact events keywords
  const highImpactKeywords = [
    'Non-Farm', 'NFP', 'Nonfarm', 'Payrolls',
    'FOMC', 'Federal Reserve', 'Fed Chair', 'Powell',
    'CPI', 'Consumer Price Index', 'Inflation',
    'GDP', 'Gross Domestic Product',
    'Interest Rate', 'Fed Funds Rate',
    'Unemployment', 'Jobless Claims',
    'Retail Sales',
    'ISM Manufacturing', 'ISM Services',
    'Core PCE', 'PCE Price Index',
    'PPI', 'Producer Price Index',
    'Durable Goods',
    'Housing Starts', 'Building Permits',
    'Trade Balance',
    'ADP Employment',
    'Initial Jobless Claims',
    'Existing Home Sales',
    'New Home Sales',
    'Consumer Confidence',
    'Michigan Consumer',
    'Empire State',
    'Philadelphia Fed'
  ];

  const mediumImpactKeywords = [
    'PMI',
    'Industrial Production',
    'Capacity Utilization',
    'Factory Orders',
    'Wholesale',
    'Business Inventories',
    'Import Prices',
    'Export Prices',
    'Leading Indicators',
    'Personal Income',
    'Personal Spending'
  ];

  // Try to find USD-related lines
  const lines = markdown.split('\n');
  
  for (const line of lines) {
    const upperLine = line.toUpperCase();
    
    // Check if line mentions USD
    if (upperLine.includes('USD') || upperLine.includes('DOLLAR') || upperLine.includes('US ')) {
      let impact: 'high' | 'medium' | 'low' = 'low';
      let eventName = '';
      
      // Check for high impact events
      for (const keyword of highImpactKeywords) {
        if (upperLine.includes(keyword.toUpperCase())) {
          impact = 'high';
          eventName = keyword;
          break;
        }
      }
      
      // Check for medium impact if not high
      if (impact === 'low') {
        for (const keyword of mediumImpactKeywords) {
          if (upperLine.includes(keyword.toUpperCase())) {
            impact = 'medium';
            eventName = keyword;
            break;
          }
        }
      }

      // Extract time pattern (e.g., 8:30am, 10:00, etc.)
      const timeMatch = line.match(/(\d{1,2}:\d{2}\s*(?:am|pm)?)/i);
      const time = timeMatch ? timeMatch[1] : 'All Day';

      // Try to extract the full event description
      const cleanLine = line.replace(/\|/g, ' ').replace(/\s+/g, ' ').trim();
      
      if (eventName || cleanLine.length > 10) {
        events.push({
          time,
          currency: 'USD',
          impact,
          event: eventName || extractEventName(cleanLine),
          forecast: extractValue(line, 'forecast'),
          previous: extractValue(line, 'previous'),
          actual: extractValue(line, 'actual'),
        });
      }
    }
  }

  // Remove duplicates based on event name
  const uniqueEvents = events.filter((event, index, self) =>
    index === self.findIndex(e => e.event.toLowerCase() === event.event.toLowerCase())
  );

  // Sort by impact (high first, then medium, then low)
  const impactOrder = { high: 0, medium: 1, low: 2 };
  uniqueEvents.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);

  return uniqueEvents;
}

function extractEventName(line: string): string {
  // Remove common prefixes/suffixes and clean up
  return line
    .replace(/USD/gi, '')
    .replace(/\d{1,2}:\d{2}\s*(?:am|pm)?/gi, '')
    .replace(/^\s*[\|\-\*]\s*/, '')
    .trim()
    .slice(0, 100);
}

function extractValue(line: string, type: string): string {
  // Try to find forecast/previous/actual values
  const patterns: Record<string, RegExp> = {
    forecast: /forecast[:\s]*([+-]?\d+\.?\d*%?)/i,
    previous: /previous[:\s]*([+-]?\d+\.?\d*%?)/i,
    actual: /actual[:\s]*([+-]?\d+\.?\d*%?)/i,
  };
  
  const match = line.match(patterns[type]);
  return match ? match[1] : '-';
}
