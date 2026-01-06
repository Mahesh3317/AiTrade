import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const baseHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

// Get cookies from NSE homepage first
async function getCookies(): Promise<string> {
  console.log('[NSE] Fetching cookies from NSE homepage...');
  
  try {
    // First request to get initial cookies
    const response = await fetch('https://www.nseindia.com/', {
      headers: baseHeaders,
    });
    
    const cookies = response.headers.get('set-cookie');
    console.log('[NSE] Initial cookies:', cookies ? 'Yes' : 'No');
    
    // Extract all cookies and combine them
    const allCookies: string[] = [];
    
    // Parse set-cookie header (may have multiple values)
    if (cookies) {
      // Split by comma but be careful with date formats
      const cookieParts = cookies.split(/,(?=\s*[^;=]+=[^;=]+)/);
      cookieParts.forEach(part => {
        const cookieValue = part.split(';')[0].trim();
        if (cookieValue && cookieValue.includes('=')) {
          allCookies.push(cookieValue);
        }
      });
    }
    
    console.log('[NSE] Parsed cookies count:', allCookies.length);
    return allCookies.join('; ');
  } catch (error) {
    console.error('[NSE] Error getting cookies:', error);
    return '';
  }
}

// Fetch option chain data
async function fetchOptionChain(symbol: string, cookies: string): Promise<any> {
  const isIndex = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'].includes(symbol.toUpperCase());
  const endpoint = isIndex 
    ? `https://www.nseindia.com/api/option-chain-indices?symbol=${symbol}`
    : `https://www.nseindia.com/api/option-chain-equities?symbol=${symbol}`;
  
  console.log('[NSE] Fetching option chain from:', endpoint);
  
  const response = await fetch(endpoint, {
    headers: {
      ...baseHeaders,
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Cookie': cookies,
      'Referer': 'https://www.nseindia.com/option-chain',
      'X-Requested-With': 'XMLHttpRequest',
    },
  });
  
  console.log('[NSE] Response status:', response.status);
  console.log('[NSE] Response headers:', Object.fromEntries(response.headers.entries()));
  
  if (!response.ok) {
    const text = await response.text();
    console.error('[NSE] Error response:', text.substring(0, 500));
    if (response.status === 401 || response.status === 403) {
      throw new Error(`NSE API blocked request (${response.status}). Try again in a few seconds.`);
    }
    throw new Error(`NSE API returned ${response.status}`);
  }
  
  const text = await response.text();
  console.log('[NSE] Raw response length:', text.length);
  console.log('[NSE] Raw response preview:', text.substring(0, 500));
  
  try {
    const jsonData = JSON.parse(text);
    console.log('[NSE] Parsed JSON, top-level keys:', Object.keys(jsonData));
    
    if (jsonData.records) {
      console.log('[NSE] Records keys:', Object.keys(jsonData.records));
      console.log('[NSE] Records.data type:', Array.isArray(jsonData.records.data) ? 'array' : typeof jsonData.records.data);
      console.log('[NSE] Records.data length:', jsonData.records.data?.length || 0);
      console.log('[NSE] Records.expiryDates:', jsonData.records.expiryDates);
      console.log('[NSE] Records.underlyingValue:', jsonData.records.underlyingValue);
      
      if (jsonData.records.data && jsonData.records.data.length > 0) {
        console.log('[NSE] First record sample:', JSON.stringify(jsonData.records.data[0]).substring(0, 300));
      }
    }
    
    if (jsonData.filtered) {
      console.log('[NSE] Filtered keys:', Object.keys(jsonData.filtered));
      console.log('[NSE] Filtered.data length:', jsonData.filtered.data?.length || 0);
    }
    
    return jsonData;
  } catch (parseError) {
    console.error('[NSE] JSON parse error:', parseError);
    console.error('[NSE] Response was:', text.substring(0, 1000));
    throw new Error('Failed to parse NSE response as JSON');
  }
}

// Fetch index quote for spot price
async function fetchIndexQuote(symbol: string, cookies: string): Promise<any> {
  const indexName = symbol === 'NIFTY' ? 'NIFTY 50' : symbol === 'BANKNIFTY' ? 'NIFTY BANK' : symbol;
  const endpoint = `https://www.nseindia.com/api/allIndices`;
  
  console.log('[NSE] Fetching index quote...');
  
  try {
    const response = await fetch(endpoint, {
      headers: {
        ...baseHeaders,
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Cookie': cookies,
        'Referer': 'https://www.nseindia.com/',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    
    console.log('[NSE] Index quote status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      const index = data.data?.find((i: any) => 
        i.index === indexName || i.indexSymbol === indexName
      );
      console.log('[NSE] Found index:', index?.index, 'last:', index?.last);
      return index;
    }
  } catch (e) {
    console.error('[NSE] Error fetching index quote:', e);
  }
  return null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol = 'NIFTY', expiry } = await req.json();
    console.log('[NSE] Request received - Symbol:', symbol, 'Expiry:', expiry);
    
    // Step 1: Get cookies
    const cookies = await getCookies();
    
    if (!cookies) {
      console.log('[NSE] No cookies obtained, trying direct request...');
    }
    
    // Add a small delay to mimic human behavior
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Step 2: Fetch option chain
    const optionChainData = await fetchOptionChain(symbol, cookies);
    
    // Step 3: Fetch spot price
    const indexQuote = await fetchIndexQuote(symbol, cookies);
    
    // Process the data
    const records = optionChainData.records || {};
    const filtered = optionChainData.filtered || {};
    
    // Try to get data from multiple possible locations
    let chainData = records.data || filtered.data || optionChainData.data || [];
    let expiryDates = records.expiryDates || optionChainData.expiryDates || [];
    let underlyingValue = records.underlyingValue || filtered.underlyingValue || 0;
    
    console.log('[NSE] Data extraction:', {
      chainDataLength: chainData.length,
      expiryDatesLength: expiryDates.length,
      underlyingValue,
    });
    
    // If no chain data, check if market is closed
    if (chainData.length === 0) {
      const now = new Date();
      const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
      const hours = istTime.getHours();
      const minutes = istTime.getMinutes();
      const isMarketHours = (hours > 9 || (hours === 9 && minutes >= 15)) && (hours < 15 || (hours === 15 && minutes <= 30));
      const isWeekend = istTime.getDay() === 0 || istTime.getDay() === 6;
      
      console.log('[NSE] Market status:', {
        istTime: istTime.toISOString(),
        hours,
        minutes,
        isMarketHours,
        isWeekend,
      });
      
      if (!isMarketHours || isWeekend) {
        const spotPrice = underlyingValue || indexQuote?.last || 0;
        return new Response(
          JSON.stringify({ 
            success: true,
            symbol,
            spotPrice,
            timestamp: records.timestamp || new Date().toISOString(),
            expiryDates,
            selectedExpiry: null,
            data: [],
            totals: {
              CE: { totalOI: 0, totalVolume: 0 },
              PE: { totalOI: 0, totalVolume: 0 },
            },
            indexQuote: indexQuote ? {
              open: indexQuote.open,
              high: indexQuote.high,
              low: indexQuote.low,
              last: indexQuote.last,
              previousClose: indexQuote.previousClose,
              change: indexQuote.variation,
              percentChange: indexQuote.percentChange,
            } : null,
            message: `Market is closed. NSE trading hours: 9:15 AM - 3:30 PM IST (Monday-Friday). Current IST time: ${istTime.toLocaleTimeString('en-IN')}`,
            marketClosed: true,
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }
    
    // Filter by expiry if provided
    const selectedExpiry = expiry || expiryDates[0] || null;
    if (selectedExpiry && chainData.length > 0) {
      const beforeFilter = chainData.length;
      chainData = chainData.filter((item: any) => item.expiryDate === selectedExpiry);
      console.log('[NSE] Filtered by expiry:', selectedExpiry, 'from', beforeFilter, 'to', chainData.length);
    }
    
    // Transform to consistent format
    const spotPrice = underlyingValue || indexQuote?.last || 0;
    const timestamp = records.timestamp || new Date().toISOString();
    
    const transformedData = chainData.map((item: any) => ({
      strikePrice: item.strikePrice,
      expiryDate: item.expiryDate,
      CE: item.CE ? {
        openInterest: item.CE.openInterest || 0,
        changeinOpenInterest: item.CE.changeinOpenInterest || 0,
        totalTradedVolume: item.CE.totalTradedVolume || 0,
        impliedVolatility: item.CE.impliedVolatility || 0,
        lastPrice: item.CE.lastPrice || 0,
        change: item.CE.change || 0,
        bidQty: item.CE.bidQty || 0,
        bidprice: item.CE.bidprice || 0,
        askQty: item.CE.askQty || 0,
        askPrice: item.CE.askPrice || 0,
        underlyingValue: item.CE.underlyingValue || spotPrice,
      } : null,
      PE: item.PE ? {
        openInterest: item.PE.openInterest || 0,
        changeinOpenInterest: item.PE.changeinOpenInterest || 0,
        totalTradedVolume: item.PE.totalTradedVolume || 0,
        impliedVolatility: item.PE.impliedVolatility || 0,
        lastPrice: item.PE.lastPrice || 0,
        change: item.PE.change || 0,
        bidQty: item.PE.bidQty || 0,
        bidprice: item.PE.bidprice || 0,
        askQty: item.PE.askQty || 0,
        askPrice: item.PE.askPrice || 0,
        underlyingValue: item.PE.underlyingValue || spotPrice,
      } : null,
    }));

    // Calculate totals
    const totals = {
      CE: {
        totalOI: filtered.CE?.totOI || chainData.reduce((sum: number, d: any) => sum + (d.CE?.openInterest || 0), 0),
        totalVolume: filtered.CE?.totVol || chainData.reduce((sum: number, d: any) => sum + (d.CE?.totalTradedVolume || 0), 0),
      },
      PE: {
        totalOI: filtered.PE?.totOI || chainData.reduce((sum: number, d: any) => sum + (d.PE?.openInterest || 0), 0),
        totalVolume: filtered.PE?.totVol || chainData.reduce((sum: number, d: any) => sum + (d.PE?.totalTradedVolume || 0), 0),
      }
    };

    const responseData = {
      success: true,
      symbol,
      spotPrice,
      timestamp,
      expiryDates,
      selectedExpiry,
      data: transformedData,
      totals,
      indexQuote: indexQuote ? {
        open: indexQuote.open,
        high: indexQuote.high,
        low: indexQuote.low,
        last: indexQuote.last,
        previousClose: indexQuote.previousClose,
        change: indexQuote.variation,
        percentChange: indexQuote.percentChange,
      } : null,
    };

    console.log('[NSE] Returning', transformedData.length, 'strikes, spot:', spotPrice);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[NSE] Error:', errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        message: 'Failed to fetch NSE data. NSE may be blocking requests or market is closed.'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
