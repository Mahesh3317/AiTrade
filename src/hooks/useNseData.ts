import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NseOptionChainData {
  success: boolean;
  symbol: string;
  spotPrice: number;
  timestamp: string;
  expiryDates: string[];
  selectedExpiry: string | null;
  data: NseOptionRow[];
  totals: {
    CE: { totalOI: number; totalVolume: number };
    PE: { totalOI: number; totalVolume: number };
  };
  indexQuote: {
    open: number;
    high: number;
    low: number;
    last: number;
    previousClose: number;
    change: number;
    percentChange: number;
  } | null;
  error?: string;
  message?: string;
  marketClosed?: boolean;
}

export interface NseOptionRow {
  strikePrice: number;
  expiryDate: string;
  CE: {
    openInterest: number;
    changeinOpenInterest: number;
    totalTradedVolume: number;
    impliedVolatility: number;
    lastPrice: number;
    change: number;
    bidQty: number;
    bidprice: number;
    askQty: number;
    askPrice: number;
    underlyingValue: number;
  } | null;
  PE: {
    openInterest: number;
    changeinOpenInterest: number;
    totalTradedVolume: number;
    impliedVolatility: number;
    lastPrice: number;
    change: number;
    bidQty: number;
    bidprice: number;
    askQty: number;
    askPrice: number;
    underlyingValue: number;
  } | null;
}

export interface NseDiagnostics {
  lastRequestTime: string | null;
  latencyMs: number | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  httpStatus: number | null;
  payloadSize: number | null;
  strikesCount: number;
  expiryDatesCount: number;
  spotPrice: number | null;
  errorMessage: string | null;
  rawResponse: any | null;
}

const SYMBOLS = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];

const initialDiagnostics: NseDiagnostics = {
  lastRequestTime: null,
  latencyMs: null,
  status: 'idle',
  httpStatus: null,
  payloadSize: null,
  strikesCount: 0,
  expiryDatesCount: 0,
  spotPrice: null,
  errorMessage: null,
  rawResponse: null,
};

export function useNseData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NseOptionChainData | null>(null);
  const [diagnostics, setDiagnostics] = useState<NseDiagnostics>(initialDiagnostics);

  const fetchOptionChain = useCallback(async (symbol: string = 'NIFTY', expiry?: string) => {
    setLoading(true);
    setError(null);
    
    const startTime = Date.now();
    setDiagnostics(prev => ({
      ...prev,
      status: 'loading',
      lastRequestTime: new Date().toISOString(),
    }));

    try {
      console.log('[NSE Hook] Fetching option chain for', symbol, expiry ? `expiry: ${expiry}` : '');

      const { data: responseData, error: fnError } = await supabase.functions.invoke('nse-option-chain', {
        body: { symbol, expiry }
      });

      const latencyMs = Date.now() - startTime;
      const payloadSize = responseData ? JSON.stringify(responseData).length : 0;

      if (fnError) {
        console.error('[NSE Hook] Function error:', fnError);
        setDiagnostics(prev => ({
          ...prev,
          status: 'error',
          latencyMs,
          payloadSize,
          httpStatus: 500,
          errorMessage: fnError.message || 'Function invocation failed',
          rawResponse: { error: fnError },
        }));
        throw new Error(fnError.message || 'Failed to invoke NSE function');
      }

      if (!responseData.success) {
        console.error('[NSE Hook] API error:', responseData);
        setDiagnostics(prev => ({
          ...prev,
          status: 'error',
          latencyMs,
          payloadSize,
          httpStatus: 200,
          errorMessage: responseData.message || responseData.error || 'NSE API returned failure',
          rawResponse: responseData,
          strikesCount: 0,
          expiryDatesCount: responseData.expiryDates?.length || 0,
          spotPrice: responseData.spotPrice || null,
        }));
        throw new Error(responseData.message || responseData.error || 'NSE API failed');
      }

      console.log('[NSE Hook] Success! Got', responseData.data?.length || 0, 'strikes');
      console.log('[NSE Hook] Response details:', {
        success: responseData.success,
        symbol: responseData.symbol,
        spotPrice: responseData.spotPrice,
        dataLength: responseData.data?.length,
        expiryDates: responseData.expiryDates?.length,
        firstStrike: responseData.data?.[0]?.strikePrice,
      });
      
      setDiagnostics(prev => ({
        ...prev,
        status: 'success',
        latencyMs,
        payloadSize,
        httpStatus: 200,
        errorMessage: null,
        rawResponse: responseData,
        strikesCount: responseData.data?.length || 0,
        expiryDatesCount: responseData.expiryDates?.length || 0,
        spotPrice: responseData.spotPrice || null,
      }));
      
      setData(responseData);
      return responseData;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error fetching NSE data';
      console.error('[NSE Hook] Error:', message);
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    data,
    diagnostics,
    symbols: SYMBOLS,
    fetchOptionChain,
  };
}
