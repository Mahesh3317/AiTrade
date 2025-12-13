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
  'Cache-Control': 'max-age=0',
};

// Get cookies from NSE homepage first
async function getCookies(): Promise<string> {
  console.log('[NSE] Fetching cookies from NSE homepage...');
  
  try {
    const response = await fetch('https://www.nseindia.com/option-chain', {
      headers: baseHeaders,
    });
    
    const cookies = response.headers.get('set-cookie');
    console.log('[NSE] Got cookies:', cookies ? 'Yes' : 'No');
    return cookies || '';
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
      'Cookie': cookies,
      'Referer': 'https://www.nseindia.com/option-chain',
    },
  });
  
  console.log('[NSE] Response status:', response.status);
  
  if (!response.ok) {
    const text = await response.text();
    console.error('[NSE] Error response:', text.substring(0, 500));
    throw new Error(`NSE API returned ${response.status}`);
  }
  
  return response.json();
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
        'Cookie': cookies,
        'Referer': 'https://www.nseindia.com/',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      const index = data.data?.find((i: any) => 
        i.index === indexName || i.indexSymbol === indexName
      );
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
    
    // Step 2: Fetch option chain
    const optionChainData = await fetchOptionChain(symbol, cookies);
    
    // Step 3: Fetch spot price
    const indexQuote = await fetchIndexQuote(symbol, cookies);
    
    // Process the data
    const records = optionChainData.records || {};
    const filtered = optionChainData.filtered || {};
    
    // Get expiry dates
    const expiryDates = records.expiryDates || [];
    
    // Filter by requested expiry if provided
    let chainData = records.data || [];
    if (expiry) {
      chainData = chainData.filter((item: any) => item.expiryDate === expiry);
    } else if (expiryDates.length > 0) {
      // Default to first expiry
      chainData = chainData.filter((item: any) => item.expiryDate === expiryDates[0]);
    }
    
    // Transform to consistent format
    const spotPrice = records.underlyingValue || indexQuote?.last || 0;
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
      selectedExpiry: expiry || expiryDates[0] || null,
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
