import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// NOTE: NSE is protected by anti-bot. We must mimic a browser session.
const baseHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
};

let cachedCookieHeader: string | null = null;
let cachedCookieAt = 0;

function mergeCookies(existing: string, incoming: string[]): string {
  const jar = new Map<string, string>();

  const add = (cookieHeader: string) => {
    cookieHeader
      .split(';')
      .map(s => s.trim())
      .filter(Boolean)
      .forEach(() => {
        // noop; we only parse from set-cookie below
      });
  };

  // existing cookie header like "a=1; b=2"
  if (existing) {
    existing.split(';').map(s => s.trim()).filter(Boolean).forEach(pair => {
      const idx = pair.indexOf('=');
      if (idx > 0) jar.set(pair.slice(0, idx), pair.slice(idx + 1));
    });
  }

  // incoming are "set-cookie" strings
  for (const sc of incoming) {
    const firstPart = sc.split(';')[0]?.trim();
    if (!firstPart) continue;
    const idx = firstPart.indexOf('=');
    if (idx <= 0) continue;
    jar.set(firstPart.slice(0, idx), firstPart.slice(idx + 1));
  }

  return Array.from(jar.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
}

async function warmupCookies(): Promise<string> {
  // Cache cookies briefly to reduce warmup spam (helps avoid blocking)
  const now = Date.now();
  if (cachedCookieHeader && now - cachedCookieAt < 30_000) {
    return cachedCookieHeader;
  }

  console.log('[NSE] Warming up session cookies...');

  let cookieHeader = '';

  const fetchPage = async (url: string) => {
    const res = await fetch(url, {
      headers: {
        ...baseHeaders,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Referer': 'https://www.nseindia.com/',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    // Deno supports getSetCookie(); fallback if not present.
    const setCookies: string[] = (res.headers as any).getSetCookie?.() ?? (res.headers.get('set-cookie') ? [res.headers.get('set-cookie') as string] : []);

    console.log('[NSE] Warmup GET', url, 'status:', res.status, 'set-cookie count:', setCookies.length);
    cookieHeader = mergeCookies(cookieHeader, setCookies);

    // Read a little body to complete the request properly.
    try {
      const t = await res.text();
      console.log('[NSE] Warmup body length:', t.length);
    } catch {
      // ignore
    }
  };

  await fetchPage('https://www.nseindia.com/');
  // Small delay helps mimic browser navigation
  await new Promise(r => setTimeout(r, 200));
  await fetchPage('https://www.nseindia.com/option-chain');

  console.log('[NSE] Warmup cookie header length:', cookieHeader.length);

  cachedCookieHeader = cookieHeader;
  cachedCookieAt = now;

  return cookieHeader;
}

async function fetchOptionChainOnce(symbol: string, cookieHeader: string): Promise<any> {
  const isIndex = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'].includes(symbol.toUpperCase());
  const endpoint = isIndex
    ? `https://www.nseindia.com/api/option-chain-indices?symbol=${encodeURIComponent(symbol)}`
    : `https://www.nseindia.com/api/option-chain-equities?symbol=${encodeURIComponent(symbol)}`;

  console.log('[NSE] Fetching option chain:', endpoint);

  const res = await fetch(endpoint, {
    headers: {
      ...baseHeaders,
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Referer': 'https://www.nseindia.com/option-chain',
      'X-Requested-With': 'XMLHttpRequest',
      'Cookie': cookieHeader,
    },
  });

  console.log('[NSE] Option-chain status:', res.status);

  const text = await res.text();
  console.log('[NSE] Option-chain raw length:', text.length);
  console.log('[NSE] Option-chain preview:', text.substring(0, 200));

  if (!res.ok) {
    throw new Error(`NSE option-chain failed (${res.status})`);
  }

  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('NSE option-chain returned non-JSON');
  }

  return json;
}

async function fetchIndexQuote(symbol: string, cookieHeader: string): Promise<any> {
  const indexName = symbol === 'NIFTY' ? 'NIFTY 50' : symbol === 'BANKNIFTY' ? 'NIFTY BANK' : symbol;
  const endpoint = `https://www.nseindia.com/api/allIndices`;

  try {
    const res = await fetch(endpoint, {
      headers: {
        ...baseHeaders,
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Referer': 'https://www.nseindia.com/',
        'X-Requested-With': 'XMLHttpRequest',
        'Cookie': cookieHeader,
      },
    });

    if (!res.ok) {
      console.log('[NSE] allIndices failed:', res.status);
      return null;
    }

    const data = await res.json();
    const index = data.data?.find((i: any) => i.index === indexName || i.indexSymbol === indexName);
    return index ?? null;
  } catch (e) {
    console.error('[NSE] Error fetching index quote:', e);
    return null;
  }
}

function isMarketOpenIST() {
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const isMarketHours = (hours > 9 || (hours === 9 && minutes >= 15)) && (hours < 15 || (hours === 15 && minutes <= 30));
  const isWeekend = istTime.getDay() === 0 || istTime.getDay() === 6;
  return { istTime, isOpen: isMarketHours && !isWeekend };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol = 'NIFTY', expiry } = await req.json();
    console.log('[NSE] Request:', { symbol, expiry });

    // Warmup + cookies
    let cookieHeader = await warmupCookies();

    // Fetch option-chain (retry once if empty payload)
    let optionChainData = await fetchOptionChainOnce(symbol, cookieHeader);

    const looksEmpty = !optionChainData || Object.keys(optionChainData).length === 0;
    if (looksEmpty) {
      console.warn('[NSE] Empty payload received. Retrying with fresh cookies...');
      cachedCookieHeader = null;
      cachedCookieAt = 0;
      cookieHeader = await warmupCookies();
      await new Promise(r => setTimeout(r, 400));
      optionChainData = await fetchOptionChainOnce(symbol, cookieHeader);
    }

    const indexQuote = await fetchIndexQuote(symbol, cookieHeader);

    const records = optionChainData?.records || {};
    const filtered = optionChainData?.filtered || {};

    let chainData = records.data || filtered.data || optionChainData?.data || [];
    const expiryDates = records.expiryDates || optionChainData?.expiryDates || [];
    const underlyingValue = records.underlyingValue || filtered.underlyingValue || 0;

    console.log('[NSE] Parsed:', {
      hasRecords: !!optionChainData?.records,
      chainDataLength: chainData?.length ?? 0,
      expiryDatesLength: expiryDates?.length ?? 0,
      underlyingValue,
    });

    if (!Array.isArray(chainData)) chainData = [];

    // If chain is empty, decide if market is closed vs blocked
    if (chainData.length === 0) {
      const { istTime, isOpen } = isMarketOpenIST();

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
          indexQuote: indexQuote
            ? {
                open: indexQuote.open,
                high: indexQuote.high,
                low: indexQuote.low,
                last: indexQuote.last,
                previousClose: indexQuote.previousClose,
                change: indexQuote.variation,
                percentChange: indexQuote.percentChange,
              }
            : null,
          message: isOpen
            ? 'NSE returned empty option-chain (likely anti-bot throttling). Retrying automatically.'
            : `Market is closed. NSE trading hours: 9:15 AM - 3:30 PM IST (Mon-Fri). Current IST time: ${istTime.toLocaleTimeString('en-IN')}`,
          marketClosed: !isOpen,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const selectedExpiry = expiry || expiryDates[0] || null;
    if (selectedExpiry) {
      chainData = chainData.filter((i: any) => i.expiryDate === selectedExpiry);
    }

    const spotPrice = underlyingValue || indexQuote?.last || 0;
    const timestamp = records.timestamp || new Date().toISOString();

    const transformedData = chainData.map((item: any) => ({
      strikePrice: item.strikePrice,
      expiryDate: item.expiryDate,
      CE: item.CE
        ? {
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
          }
        : null,
      PE: item.PE
        ? {
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
          }
        : null,
    }));

    const totals = {
      CE: {
        totalOI: filtered.CE?.totOI || chainData.reduce((sum: number, d: any) => sum + (d.CE?.openInterest || 0), 0),
        totalVolume: filtered.CE?.totVol || chainData.reduce((sum: number, d: any) => sum + (d.CE?.totalTradedVolume || 0), 0),
      },
      PE: {
        totalOI: filtered.PE?.totOI || chainData.reduce((sum: number, d: any) => sum + (d.PE?.openInterest || 0), 0),
        totalVolume: filtered.PE?.totVol || chainData.reduce((sum: number, d: any) => sum + (d.PE?.totalTradedVolume || 0), 0),
      },
    };

    return new Response(
      JSON.stringify({
        success: true,
        symbol,
        spotPrice,
        timestamp,
        expiryDates,
        selectedExpiry,
        data: transformedData,
        totals,
        indexQuote: indexQuote
          ? {
              open: indexQuote.open,
              high: indexQuote.high,
              low: indexQuote.low,
              last: indexQuote.last,
              previousClose: indexQuote.previousClose,
              change: indexQuote.variation,
              percentChange: indexQuote.percentChange,
            }
          : null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[NSE] Error:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        message: 'Failed to fetch NSE data (blocked or market closed).',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
