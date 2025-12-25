import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const baseHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
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
      'Referer': 'https://www.nseindia.com',
    },
  });
  
  console.log('[NSE] Response status:', response.status);
  
  if (!response.ok) {
    const text = await response.text();
    console.error('[NSE] Error response:', text.substring(0, 500));
    if (response.status === 403) {
      throw new Error('NSE API blocked request (403). Try again in a few seconds.');
    }
    throw new Error(`NSE API returned ${response.status}`);
  }
  
  const jsonData = await response.json();
  console.log('[NSE] Response received, records.data length:', jsonData.records?.data?.length || 0);
  console.log('[NSE] Response top-level keys:', Object.keys(jsonData));
  if (jsonData.records) {
    console.log('[NSE] Records keys:', Object.keys(jsonData.records));
    console.log('[NSE] Records.data type:', Array.isArray(jsonData.records.data) ? 'array' : typeof jsonData.records.data);
    console.log('[NSE] Records.expiryDates:', jsonData.records.expiryDates?.length || 0, 'items');
  }
  return jsonData;
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
    
    // Debug: Log full response structure
    console.log('[NSE] Full response keys:', Object.keys(optionChainData));
    console.log('[NSE] Response has records:', !!optionChainData.records);
    console.log('[NSE] Response has filtered:', !!optionChainData.filtered);
    
    // Step 3: Fetch spot price
    const indexQuote = await fetchIndexQuote(symbol, cookies);
    
    // Process the data
    const records = optionChainData.records || {};
    const filtered = optionChainData.filtered || {};
    
    // Debug: Check all possible data locations
    console.log('[NSE] Raw data structure:', {
      hasRecords: !!records,
      hasData: !!records.data,
      dataLength: records.data?.length || 0,
      hasExpiryDates: !!records.expiryDates,
      expiryDatesLength: records.expiryDates?.length || 0,
      firstExpiry: records.expiryDates?.[0] || 'none',
      underlyingValue: records.underlyingValue,
      // Check if data is in a different location
      hasOptionChainData: !!optionChainData.data,
      optionChainDataLength: optionChainData.data?.length || 0,
      recordsKeys: records ? Object.keys(records) : [],
    });
    
    // Check if data is directly in optionChainData (some NSE responses have this structure)
    if (!records.data && optionChainData.data) {
      console.log('[NSE] Data found in optionChainData.data instead of records.data');
      records.data = optionChainData.data;
    }
    
    // Check if expiryDates is in a different location
    if (!records.expiryDates && optionChainData.expiryDates) {
      console.log('[NSE] Expiry dates found in optionChainData.expiryDates');
      records.expiryDates = optionChainData.expiryDates;
    }
    
    // Get expiry dates
    const expiryDates = records.expiryDates || [];
    console.log('[NSE] Expiry dates from NSE:', expiryDates.length, expiryDates);
    
    // Filter by requested expiry if provided
    let chainData = records.data || [];
    console.log('[NSE] Chain data before filtering:', chainData.length, 'items');
    
    // Debug: Log first few items to understand structure
    if (chainData.length > 0) {
      console.log('[NSE] First item sample:', JSON.stringify(chainData[0]).substring(0, 200));
      console.log('[NSE] First item expiryDate:', chainData[0]?.expiryDate);
    } else {
      // Check if market is closed (NSE hours: 9:15 AM - 3:30 PM IST)
      const now = new Date();
      const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
      const hours = istTime.getHours();
      const minutes = istTime.getMinutes();
      const isMarketHours = (hours > 9 || (hours === 9 && minutes >= 15)) && (hours < 15 || (hours === 15 && minutes <= 30));
      const isWeekend = istTime.getDay() === 0 || istTime.getDay() === 6;
      
      console.log('[NSE] Market status check:', {
        istTime: istTime.toISOString(),
        hours,
        minutes,
        isMarketHours,
        isWeekend,
        marketClosed: !isMarketHours || isWeekend,
      });
      
      if (!isMarketHours || isWeekend) {
        console.log('[NSE] Market is closed - returning empty data with message');
        return new Response(
          JSON.stringify({ 
            success: true,
            symbol,
            spotPrice: records.underlyingValue || indexQuote?.last || 0,
            timestamp: records.timestamp || new Date().toISOString(),
            expiryDates: expiryDates,
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
    if (expiry) {
      const beforeFilter = chainData.length;
      chainData = chainData.filter((item: any) => item.expiryDate === expiry);
      console.log('[NSE] After expiry filter (', expiry, '):', beforeFilter, '->', chainData.length, 'items');
    } else if (expiryDates.length > 0) {
      // Default to first expiry
      const firstExpiry = expiryDates[0];
      const beforeFilter = chainData.length;
      chainData = chainData.filter((item: any) => item.expiryDate === firstExpiry);
      console.log('[NSE] After default expiry filter (', firstExpiry, '):', beforeFilter, '->', chainData.length, 'items');
    } else {
      // No expiry dates, use all data
      console.log('[NSE] No expiry dates, using all', chainData.length, 'items');
    }
    
    // If after filtering we have no data, still return structure but with empty array
    if (chainData.length === 0) {
      console.warn('[NSE] No data after expiry filtering, but returning structure');
      // Continue to return empty array - don't error out
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
