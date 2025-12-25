/**
 * Hook to fetch historical price data for technical analysis
 * Currently uses mock data, but structured to easily connect to real API
 */

import { useState, useEffect, useCallback } from 'react';
import { CandleData } from '@/utils/technicalIndicators';

export interface HistoricalDataOptions {
  symbol: string;
  timeframe: '1m' | '5m' | '15m' | '1h' | '1d';
  limit?: number;
  currentSpotPrice?: number; // Optional current spot price for more accurate mock data
}

/**
 * Generate mock historical data for testing
 * In production, this would fetch from a real API
 * TODO: Connect to actual historical data API (NSE, broker API, etc.)
 */
function generateMockHistoricalData(
  symbol: string,
  timeframe: string,
  limit: number = 100,
  currentSpotPrice?: number
): CandleData[] {
  // Use current spot price if provided, otherwise use default
  const basePrice = currentSpotPrice || (symbol === 'NIFTY' ? 26142 : 50000);
  const candles: CandleData[] = [];
  
  let currentPrice = basePrice;
  const now = Date.now();
  const intervalMs = timeframe === '1m' ? 60000 : timeframe === '5m' ? 300000 : timeframe === '15m' ? 900000 : 3600000;

  // Add some trend to make it more realistic
  let trend = 0;
  for (let i = limit - 1; i >= 0; i--) {
    const timestamp = now - (i * intervalMs);
    
    // Simulate price movement with trend and randomness
    const randomChange = (Math.random() - 0.5) * basePrice * 0.008; // ±0.4% random change
    trend += (Math.random() - 0.5) * 0.0001; // Small trend component
    const change = randomChange + (trend * basePrice);
    
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * basePrice * 0.004;
    const low = Math.min(open, close) - Math.random() * basePrice * 0.004;
    const volume = Math.floor(Math.random() * 1000000) + 100000;

    candles.push({
      open,
      high,
      low,
      close,
      volume,
      timestamp: new Date(timestamp).toISOString(),
    });

    currentPrice = close;
  }

  return candles;
}

export function useHistoricalData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, CandleData[]>>({});

  const fetchHistoricalData = useCallback(async (options: HistoricalDataOptions): Promise<CandleData[]> => {
    const { symbol, timeframe, limit = 100 } = options;
    const cacheKey = `${symbol}_${timeframe}`;

    setLoading(true);
    setError(null);

    try {
      // Check cache first
      if (data[cacheKey] && data[cacheKey].length > 0) {
        setLoading(false);
        return data[cacheKey];
      }

      // TODO: Replace with real API call
      // For now, use mock data
      // In production, fetch from: NSE API, broker API, or authorized market data endpoints
      const historicalData = generateMockHistoricalData(symbol, timeframe, limit, options.currentSpotPrice);

      setData(prev => ({
        ...prev,
        [cacheKey]: historicalData,
      }));

      setLoading(false);
      return historicalData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch historical data';
      setError(message);
      setLoading(false);
      
      // Return empty array on error
      return [];
    }
  }, [data]);

  const clearCache = useCallback(() => {
    setData({});
  }, []);

  return {
    loading,
    error,
    data,
    fetchHistoricalData,
    clearCache,
  };
}

