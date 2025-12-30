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

// High impact USD events keywords
const HIGH_IMPACT_KEYWORDS = [
  'Non-Farm', 'NFP', 'Nonfarm', 'Payrolls', 'Employment Change',
  'FOMC', 'Federal Reserve', 'Fed Chair', 'Powell', 'Interest Rate', 'Fed Funds',
  'CPI', 'Consumer Price Index', 'Inflation',
  'GDP', 'Gross Domestic Product',
  'Unemployment Rate', 'Jobless Claims', 'Initial Claims',
  'Retail Sales',
  'ISM Manufacturing', 'ISM Services', 'ISM Non-Manufacturing',
  'Core PCE', 'PCE Price',
  'PPI', 'Producer Price',
  'Durable Goods',
  'ADP', 'Employment',
  'Consumer Confidence', 'Michigan', 'Sentiment'
];

const MEDIUM_IMPACT_KEYWORDS = [
  'PMI', 'Manufacturing PMI', 'Services PMI',
  'Industrial Production',
  'Factory Orders',
  'Trade Balance',
  'Housing', 'Home Sales', 'Building Permits',
  'Import', 'Export',
  'Personal Income', 'Personal Spending',
  'Wholesale', 'Business Inventories'
];

function getImpactLevel(eventName: string, providedImpact?: string): 'high' | 'medium' | 'low' {
  const upperName = eventName.toUpperCase();
  
  // Check for high impact keywords
  for (const keyword of HIGH_IMPACT_KEYWORDS) {
    if (upperName.includes(keyword.toUpperCase())) {
      return 'high';
    }
  }
  
  // Check for medium impact keywords
  for (const keyword of MEDIUM_IMPACT_KEYWORDS) {
    if (upperName.includes(keyword.toUpperCase())) {
      return 'medium';
    }
  }
  
  // Use provided impact if available
  if (providedImpact) {
    const lowerImpact = providedImpact.toLowerCase();
    if (lowerImpact.includes('high') || lowerImpact === '3') return 'high';
    if (lowerImpact.includes('medium') || lowerImpact === '2') return 'medium';
  }
  
  return 'low';
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

    // Use TradingEconomics public calendar (no API key required for basic data)
    // Format: YYYY-MM-DD
    const startDate = date;
    const endDate = date;
    
    // Try multiple sources
    let events: EconomicEvent[] = [];
    
    // Source 1: Investing.com RSS/API alternative - using a public economic calendar API
    try {
      // Using DailyFX calendar API (public, no auth required)
      const dailyFxUrl = `https://www.dailyfx.com/economic-calendar/events/${date}`;
      console.log('Trying DailyFX source...');
      
      // Alternative: Use Firecrawl to scrape investing.com economic calendar
      const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
      if (apiKey) {
        const investingUrl = `https://www.investing.com/economic-calendar/`;
        
        console.log('Scraping Investing.com calendar...');
        
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: investingUrl,
            formats: ['markdown'],
            onlyMainContent: true,
            waitFor: 5000,
          }),
        });

        const data = await response.json();
        const markdown = data.data?.markdown || data.markdown || '';
        
        console.log('Markdown length:', markdown.length);
        
        // Parse the markdown for USD events
        events = parseInvestingCalendar(markdown, date);
        console.log(`Parsed ${events.length} events from Investing.com`);
      }
    } catch (e) {
      console.error('Error with primary source:', e);
    }

    // If no events found, try alternative parsing or return sample data for known dates
    if (events.length === 0) {
      events = getKnownEventsForDate(date);
      console.log(`Using known events database: ${events.length} events`);
    }

    // Filter only USD events and sort by impact
    const usdEvents = events.filter(e => e.currency === 'USD');
    const impactOrder = { high: 0, medium: 1, low: 2 };
    usdEvents.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);

    console.log(`Returning ${usdEvents.length} USD events for ${date}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        events: usdEvents,
        date,
        source: events.length > 0 ? 'calendar' : 'database'
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

function parseInvestingCalendar(markdown: string, targetDate: string): EconomicEvent[] {
  const events: EconomicEvent[] = [];
  const lines = markdown.split('\n');
  
  for (const line of lines) {
    const upperLine = line.toUpperCase();
    
    // Look for USD mentions
    if (upperLine.includes('USD') || upperLine.includes('UNITED STATES') || upperLine.includes('U.S.')) {
      // Try to extract event details
      const timeMatch = line.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/);
      const time = timeMatch ? timeMatch[1] : 'All Day';
      
      // Extract event name - look for known patterns
      let eventName = '';
      let impact: 'high' | 'medium' | 'low' = 'low';
      
      for (const keyword of [...HIGH_IMPACT_KEYWORDS, ...MEDIUM_IMPACT_KEYWORDS]) {
        if (upperLine.includes(keyword.toUpperCase())) {
          eventName = keyword;
          impact = getImpactLevel(keyword);
          break;
        }
      }
      
      if (eventName && !events.some(e => e.event === eventName)) {
        events.push({
          time,
          currency: 'USD',
          impact,
          event: eventName,
          forecast: '-',
          previous: '-',
          actual: '-'
        });
      }
    }
  }
  
  return events;
}

// Known important economic events database
function getKnownEventsForDate(date: string): EconomicEvent[] {
  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayOfMonth = dateObj.getDate();
  const month = dateObj.getMonth(); // 0-indexed
  
  const events: EconomicEvent[] = [];
  
  // Weekly events
  if (dayOfWeek === 4) { // Thursday
    events.push({
      time: '8:30 AM',
      currency: 'USD',
      impact: 'medium',
      event: 'Initial Jobless Claims',
      forecast: '-',
      previous: '-',
      actual: '-'
    });
  }
  
  // First Friday of the month - NFP
  if (dayOfWeek === 5 && dayOfMonth <= 7) {
    events.push({
      time: '8:30 AM',
      currency: 'USD',
      impact: 'high',
      event: 'Non-Farm Payrolls (NFP)',
      forecast: '-',
      previous: '-',
      actual: '-'
    });
    events.push({
      time: '8:30 AM',
      currency: 'USD',
      impact: 'high',
      event: 'Unemployment Rate',
      forecast: '-',
      previous: '-',
      actual: '-'
    });
  }
  
  // Mid-month CPI (usually around 12th-14th)
  if (dayOfMonth >= 10 && dayOfMonth <= 14 && dayOfWeek !== 0 && dayOfWeek !== 6) {
    events.push({
      time: '8:30 AM',
      currency: 'USD',
      impact: 'high',
      event: 'Consumer Price Index (CPI)',
      forecast: '-',
      previous: '-',
      actual: '-'
    });
    events.push({
      time: '8:30 AM',
      currency: 'USD',
      impact: 'high',
      event: 'Core CPI m/m',
      forecast: '-',
      previous: '-',
      actual: '-'
    });
  }
  
  // FOMC meetings (usually 8 times per year)
  // January, March, May, June, July, September, November, December
  const fomcMonths = [0, 2, 4, 5, 6, 8, 10, 11];
  if (fomcMonths.includes(month) && dayOfMonth >= 15 && dayOfMonth <= 20 && dayOfWeek === 3) {
    events.push({
      time: '2:00 PM',
      currency: 'USD',
      impact: 'high',
      event: 'FOMC Statement & Interest Rate Decision',
      forecast: '-',
      previous: '-',
      actual: '-'
    });
    events.push({
      time: '2:30 PM',
      currency: 'USD',
      impact: 'high',
      event: 'FOMC Press Conference',
      forecast: '-',
      previous: '-',
      actual: '-'
    });
  }
  
  // Last week of month - GDP (quarterly)
  if (dayOfMonth >= 25 && dayOfMonth <= 30 && (month === 0 || month === 3 || month === 6 || month === 9)) {
    events.push({
      time: '8:30 AM',
      currency: 'USD',
      impact: 'high',
      event: 'GDP q/q',
      forecast: '-',
      previous: '-',
      actual: '-'
    });
  }
  
  // Retail Sales (mid-month)
  if (dayOfMonth >= 13 && dayOfMonth <= 17 && dayOfWeek !== 0 && dayOfWeek !== 6) {
    events.push({
      time: '8:30 AM',
      currency: 'USD',
      impact: 'high',
      event: 'Retail Sales m/m',
      forecast: '-',
      previous: '-',
      actual: '-'
    });
  }
  
  // ISM Manufacturing (first business day of month)
  if (dayOfMonth <= 3 && dayOfWeek !== 0 && dayOfWeek !== 6) {
    events.push({
      time: '10:00 AM',
      currency: 'USD',
      impact: 'high',
      event: 'ISM Manufacturing PMI',
      forecast: '-',
      previous: '-',
      actual: '-'
    });
  }
  
  // ISM Services (third business day of month)
  if (dayOfMonth >= 3 && dayOfMonth <= 5 && dayOfWeek !== 0 && dayOfWeek !== 6) {
    events.push({
      time: '10:00 AM',
      currency: 'USD',
      impact: 'high',
      event: 'ISM Services PMI',
      forecast: '-',
      previous: '-',
      actual: '-'
    });
  }
  
  // ADP Employment (2 days before NFP, usually Wednesday)
  if (dayOfWeek === 3 && dayOfMonth <= 6) {
    events.push({
      time: '8:15 AM',
      currency: 'USD',
      impact: 'high',
      event: 'ADP Non-Farm Employment Change',
      forecast: '-',
      previous: '-',
      actual: '-'
    });
  }
  
  // Core PCE (last Friday of month)
  if (dayOfWeek === 5 && dayOfMonth >= 25) {
    events.push({
      time: '8:30 AM',
      currency: 'USD',
      impact: 'high',
      event: 'Core PCE Price Index m/m',
      forecast: '-',
      previous: '-',
      actual: '-'
    });
  }
  
  return events;
}
