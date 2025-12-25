/**
 * Candlestick Pattern Detector
 * Detects: Engulfing, Hammer, Shooting Star, Doji, Inside Bar, Marubozu
 */

export interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  timestamp?: number | string;
}

export type CandlestickPattern =
  | 'bullish_engulfing'
  | 'bearish_engulfing'
  | 'hammer'
  | 'shooting_star'
  | 'doji'
  | 'inside_bar'
  | 'bullish_marubozu'
  | 'bearish_marubozu'
  | null;

export interface PatternDetection {
  pattern: CandlestickPattern;
  strength: 'weak' | 'moderate' | 'strong';
  description: string;
}

/**
 * Calculate candle body size
 */
function getBodySize(candle: CandleData): number {
  return Math.abs(candle.close - candle.open);
}

/**
 * Calculate candle range
 */
function getRange(candle: CandleData): number {
  return candle.high - candle.low;
}

/**
 * Check if candle is bullish
 */
function isBullish(candle: CandleData): boolean {
  return candle.close > candle.open;
}

/**
 * Check if candle is bearish
 */
function isBearish(candle: CandleData): boolean {
  return candle.close < candle.open;
}

/**
 * Detect Bullish Engulfing Pattern
 */
function detectBullishEngulfing(current: CandleData, previous: CandleData): PatternDetection | null {
  if (!previous) return null;

  const prevBearish = isBearish(previous);
  const currBullish = isBullish(current);
  
  if (!prevBearish || !currBullish) return null;

  const prevBody = getBodySize(previous);
  const currBody = getBodySize(current);
  const range = getRange(previous);

  // Current candle must engulf previous candle
  if (current.open < previous.close && current.close > previous.open && currBody > prevBody) {
    const strength = currBody > range * 0.7 ? 'strong' : currBody > range * 0.5 ? 'moderate' : 'weak';
    return {
      pattern: 'bullish_engulfing',
      strength,
      description: `Bullish Engulfing (${strength}) - Potential reversal to upside`,
    };
  }

  return null;
}

/**
 * Detect Bearish Engulfing Pattern
 */
function detectBearishEngulfing(current: CandleData, previous: CandleData): PatternDetection | null {
  if (!previous) return null;

  const prevBullish = isBullish(previous);
  const currBearish = isBearish(current);
  
  if (!prevBullish || !currBearish) return null;

  const prevBody = getBodySize(previous);
  const currBody = getBodySize(current);
  const range = getRange(previous);

  // Current candle must engulf previous candle
  if (current.open > previous.close && current.close < previous.open && currBody > prevBody) {
    const strength = currBody > range * 0.7 ? 'strong' : currBody > range * 0.5 ? 'moderate' : 'weak';
    return {
      pattern: 'bearish_engulfing',
      strength,
      description: `Bearish Engulfing (${strength}) - Potential reversal to downside`,
    };
  }

  return null;
}

/**
 * Detect Hammer Pattern
 */
function detectHammer(candle: CandleData): PatternDetection | null {
  const body = getBodySize(candle);
  const range = getRange(candle);
  const upperShadow = candle.high - Math.max(candle.open, candle.close);
  const lowerShadow = Math.min(candle.open, candle.close) - candle.low;

  if (range === 0) return null;

  // Hammer: small body, long lower shadow, little/no upper shadow
  const bodyRatio = body / range;
  const lowerShadowRatio = lowerShadow / range;
  const upperShadowRatio = upperShadow / range;

  if (bodyRatio < 0.3 && lowerShadowRatio > 0.6 && upperShadowRatio < 0.2) {
    const strength = lowerShadowRatio > 0.75 ? 'strong' : 'moderate';
    return {
      pattern: 'hammer',
      strength,
      description: `Hammer (${strength}) - Potential bullish reversal`,
    };
  }

  return null;
}

/**
 * Detect Shooting Star Pattern
 */
function detectShootingStar(candle: CandleData): PatternDetection | null {
  const body = getBodySize(candle);
  const range = getRange(candle);
  const upperShadow = candle.high - Math.max(candle.open, candle.close);
  const lowerShadow = Math.min(candle.open, candle.close) - candle.low;

  if (range === 0) return null;

  // Shooting Star: small body, long upper shadow, little/no lower shadow
  const bodyRatio = body / range;
  const upperShadowRatio = upperShadow / range;
  const lowerShadowRatio = lowerShadow / range;

  if (bodyRatio < 0.3 && upperShadowRatio > 0.6 && lowerShadowRatio < 0.2) {
    const strength = upperShadowRatio > 0.75 ? 'strong' : 'moderate';
    return {
      pattern: 'shooting_star',
      strength,
      description: `Shooting Star (${strength}) - Potential bearish reversal`,
    };
  }

  return null;
}

/**
 * Detect Doji Pattern
 */
function detectDoji(candle: CandleData): PatternDetection | null {
  const body = getBodySize(candle);
  const range = getRange(candle);

  if (range === 0) return null;

  // Doji: very small body relative to range
  const bodyRatio = body / range;

  if (bodyRatio < 0.1) {
    const strength = bodyRatio < 0.05 ? 'strong' : 'moderate';
    return {
      pattern: 'doji',
      strength,
      description: `Doji (${strength}) - Indecision, potential reversal`,
    };
  }

  return null;
}

/**
 * Detect Inside Bar Pattern
 */
function detectInsideBar(current: CandleData, previous: CandleData): PatternDetection | null {
  if (!previous) return null;

  // Inside bar: current candle is completely inside previous candle
  if (
    current.high <= previous.high &&
    current.low >= previous.low &&
    (current.high < previous.high || current.low > previous.low)
  ) {
    const strength = getRange(current) < getRange(previous) * 0.5 ? 'strong' : 'moderate';
    return {
      pattern: 'inside_bar',
      strength,
      description: `Inside Bar (${strength}) - Consolidation, watch for breakout`,
    };
  }

  return null;
}

/**
 * Detect Marubozu Pattern
 */
function detectMarubozu(candle: CandleData): PatternDetection | null {
  const body = getBodySize(candle);
  const range = getRange(candle);

  if (range === 0) return null;

  // Marubozu: body is almost the entire range (very small or no shadows)
  const bodyRatio = body / range;

  if (bodyRatio > 0.95) {
    const pattern = isBullish(candle) ? 'bullish_marubozu' : 'bearish_marubozu';
    const strength = bodyRatio > 0.98 ? 'strong' : 'moderate';
    return {
      pattern,
      strength,
      description: `${isBullish(candle) ? 'Bullish' : 'Bearish'} Marubozu (${strength}) - Strong ${isBullish(candle) ? 'buying' : 'selling'} pressure`,
    };
  }

  return null;
}

/**
 * Detect all candlestick patterns for the latest candle
 */
export function detectCandlestickPatterns(candles: CandleData[]): PatternDetection | null {
  if (candles.length < 2) return null;

  const current = candles[candles.length - 1];
  const previous = candles[candles.length - 2];

  // Check patterns in order of importance
  const patterns = [
    detectBullishEngulfing(current, previous),
    detectBearishEngulfing(current, previous),
    detectHammer(current),
    detectShootingStar(current),
    detectDoji(current),
    detectInsideBar(current, previous),
    detectMarubozu(current),
  ];

  // Return first detected pattern
  for (const pattern of patterns) {
    if (pattern) return pattern;
  }

  return null;
}

