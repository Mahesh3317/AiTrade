/**
 * Technical Indicators Calculator
 * EMA, RSI, MACD, Bollinger Bands, Supertrend
 */

export interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  timestamp?: number | string;
}

export interface EMAResult {
  ema9: number;
  ema21: number;
  ema50: number;
}

export interface RSIResult {
  rsi: number;
  isOverbought: boolean;
  isOversold: boolean;
}

export interface MACDResult {
  macd: number;
  signal: number;
  histogram: number;
}

export interface BollingerBandsResult {
  upper: number;
  middle: number; // SMA
  lower: number;
  bandwidth: number;
}

export interface SupertrendResult {
  value: number;
  trend: 'up' | 'down';
}

/**
 * Calculate EMA (Exponential Moving Average)
 */
export function calculateEMA(prices: number[], period: number): number[] {
  if (prices.length === 0) return [];
  if (prices.length < period) return prices.map(() => prices[0]);

  const multiplier = 2 / (period + 1);
  const ema: number[] = [];

  // First EMA is SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  ema[period - 1] = sum / period;

  // Calculate subsequent EMAs
  for (let i = period; i < prices.length; i++) {
    ema[i] = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1];
  }

  return ema;
}

/**
 * Calculate multiple EMAs
 */
export function calculateEMAs(candles: CandleData[]): EMAResult[] {
  const closes = candles.map(c => c.close);
  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const ema50 = calculateEMA(closes, 50);

  const result: EMAResult[] = [];
  const maxLength = Math.max(ema9.length, ema21.length, ema50.length);

  for (let i = 0; i < maxLength; i++) {
    result.push({
      ema9: ema9[i] || closes[i] || 0,
      ema21: ema21[i] || closes[i] || 0,
      ema50: ema50[i] || closes[i] || 0,
    });
  }

  return result;
}

/**
 * Calculate RSI (Relative Strength Index)
 */
export function calculateRSI(prices: number[], period: number = 14): RSIResult[] {
  if (prices.length < period + 1) {
    return prices.map(() => ({ rsi: 50, isOverbought: false, isOversold: false }));
  }

  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  const result: RSIResult[] = [];
  
  // Calculate initial average gain and loss
  let avgGain = 0;
  let avgLoss = 0;
  
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  
  avgGain /= period;
  avgLoss /= period;

  // Calculate RSI for first period
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  result.push({
    rsi,
    isOverbought: rsi > 70,
    isOversold: rsi < 30,
  });

  // Calculate subsequent RSIs using Wilder's smoothing
  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (change < 0 ? Math.abs(change) : 0)) / period;
    
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    result.push({
      rsi,
      isOverbought: rsi > 70,
      isOversold: rsi < 30,
    });
  }

  // Pad beginning with neutral RSI
  while (result.length < prices.length) {
    result.unshift({ rsi: 50, isOverbought: false, isOversold: false });
  }

  return result;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): MACDResult[] {
  if (prices.length < slowPeriod) {
    return prices.map(() => ({ macd: 0, signal: 0, histogram: 0 }));
  }

  const ema12 = calculateEMA(prices, fastPeriod);
  const ema26 = calculateEMA(prices, slowPeriod);
  
  const macdLine: number[] = [];
  const minLength = Math.min(ema12.length, ema26.length);
  
  for (let i = 0; i < minLength; i++) {
    macdLine.push(ema12[i] - ema26[i]);
  }

  const signalLine = calculateEMA(macdLine, signalPeriod);
  
  const result: MACDResult[] = [];
  for (let i = 0; i < macdLine.length; i++) {
    const signal = signalLine[i] || 0;
    result.push({
      macd: macdLine[i],
      signal,
      histogram: macdLine[i] - signal,
    });
  }

  // Pad beginning
  while (result.length < prices.length) {
    result.unshift({ macd: 0, signal: 0, histogram: 0 });
  }

  return result;
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): BollingerBandsResult[] {
  if (prices.length < period) {
    return prices.map(() => ({ upper: 0, middle: 0, lower: 0, bandwidth: 0 }));
  }

  const result: BollingerBandsResult[] = [];

  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const sma = slice.reduce((a, b) => a + b, 0) / period;
    
    const variance = slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const standardDev = Math.sqrt(variance);
    
    const upper = sma + (stdDev * standardDev);
    const lower = sma - (stdDev * standardDev);
    const bandwidth = ((upper - lower) / sma) * 100;

    result.push({
      upper,
      middle: sma,
      lower,
      bandwidth,
    });
  }

  // Pad beginning
  while (result.length < prices.length) {
    const first = result[0] || { upper: 0, middle: 0, lower: 0, bandwidth: 0 };
    result.unshift(first);
  }

  return result;
}

/**
 * Calculate Supertrend
 */
export function calculateSupertrend(candles: CandleData[], period: number = 10, multiplier: number = 3): SupertrendResult[] {
  if (candles.length < period) {
    return candles.map(() => ({ value: 0, trend: 'up' as const }));
  }

  const result: SupertrendResult[] = [];
  const atr: number[] = [];

  // Calculate ATR (Average True Range)
  for (let i = 1; i < candles.length; i++) {
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    atr.push(tr);
  }

  // Calculate ATR moving average
  const atrMA: number[] = [];
  for (let i = period - 1; i < atr.length; i++) {
    const slice = atr.slice(i - period + 1, i + 1);
    atrMA.push(slice.reduce((a, b) => a + b, 0) / period);
  }

  // Calculate Supertrend
  for (let i = period; i < candles.length; i++) {
    const hl2 = (candles[i].high + candles[i].low) / 2;
    const atrValue = atrMA[i - period] || atrMA[0] || 0;
    const upperBand = hl2 + (multiplier * atrValue);
    const lowerBand = hl2 - (multiplier * atrValue);

    let supertrend = 0;
    let trend: 'up' | 'down' = 'up';

    if (i === period) {
      supertrend = upperBand;
      trend = candles[i].close > supertrend ? 'up' : 'down';
    } else {
      const prevSupertrend = result[result.length - 1].value;
      const prevTrend = result[result.length - 1].trend;

      if (prevTrend === 'up') {
        supertrend = Math.max(lowerBand, prevSupertrend);
        if (candles[i].close < supertrend) {
          trend = 'down';
          supertrend = upperBand;
        } else {
          trend = 'up';
        }
      } else {
        supertrend = Math.min(upperBand, prevSupertrend);
        if (candles[i].close > supertrend) {
          trend = 'up';
          supertrend = lowerBand;
        } else {
          trend = 'down';
        }
      }
    }

    result.push({ value: supertrend, trend });
  }

  // Pad beginning
  while (result.length < candles.length) {
    result.unshift({ value: 0, trend: 'up' });
  }

  return result;
}

/**
 * Calculate VWAP (Volume Weighted Average Price)
 */
export function calculateVWAP(candles: CandleData[]): number[] {
  if (candles.length === 0) return [];
  
  const vwap: number[] = [];
  let cumulativeTPV = 0; // Typical Price * Volume
  let cumulativeVolume = 0;

  for (const candle of candles) {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    const volume = candle.volume || 1;
    
    cumulativeTPV += typicalPrice * volume;
    cumulativeVolume += volume;
    
    vwap.push(cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : typicalPrice);
  }

  return vwap;
}

