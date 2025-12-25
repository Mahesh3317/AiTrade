/**
 * Price Action Analyzer
 * Analyzes market structure, VWAP positioning, breakouts
 */

import { CandleData, calculateVWAP } from './technicalIndicators';

export interface MarketStructure {
  trend: 'uptrend' | 'downtrend' | 'range';
  higherHighs: boolean;
  higherLows: boolean;
  lowerHighs: boolean;
  lowerLows: boolean;
  structure: 'HH_HL' | 'LH_LL' | 'MIXED' | 'NEUTRAL';
}

export interface VWAPAnalysis {
  priceVsVWAP: 'above' | 'below' | 'at';
  distance: number; // percentage distance from VWAP
  strength: 'strong' | 'moderate' | 'weak';
}

export interface BreakoutAnalysis {
  isBreakout: boolean;
  direction: 'up' | 'down' | null;
  strength: 'strong' | 'moderate' | 'weak';
  resistance?: number;
  support?: number;
}

/**
 * Analyze market structure (HH/HL, LH/LL)
 */
export function analyzeMarketStructure(candles: CandleData[], lookback: number = 20): MarketStructure {
  if (candles.length < lookback) {
    return {
      trend: 'range',
      higherHighs: false,
      higherLows: false,
      lowerHighs: false,
      lowerLows: false,
      structure: 'NEUTRAL',
    };
  }

  const recent = candles.slice(-lookback);
  const highs = recent.map(c => c.high);
  const lows = recent.map(c => c.low);

  // Find swing highs and lows
  const swingHighs: number[] = [];
  const swingLows: number[] = [];

  for (let i = 1; i < recent.length - 1; i++) {
    if (recent[i].high > recent[i - 1].high && recent[i].high > recent[i + 1].high) {
      swingHighs.push(recent[i].high);
    }
    if (recent[i].low < recent[i - 1].low && recent[i].low < recent[i + 1].low) {
      swingLows.push(recent[i].low);
    }
  }

  // Check for higher highs and higher lows
  let higherHighs = false;
  let higherLows = false;
  let lowerHighs = false;
  let lowerLows = false;

  if (swingHighs.length >= 2) {
    higherHighs = swingHighs[swingHighs.length - 1] > swingHighs[swingHighs.length - 2];
    lowerHighs = swingHighs[swingHighs.length - 1] < swingHighs[swingHighs.length - 2];
  }

  if (swingLows.length >= 2) {
    higherLows = swingLows[swingLows.length - 1] > swingLows[swingLows.length - 2];
    lowerLows = swingLows[swingLows.length - 1] < swingLows[swingLows.length - 2];
  }

  // Determine structure
  let structure: 'HH_HL' | 'LH_LL' | 'MIXED' | 'NEUTRAL' = 'NEUTRAL';
  if (higherHighs && higherLows) {
    structure = 'HH_HL';
  } else if (lowerHighs && lowerLows) {
    structure = 'LH_LL';
  } else if ((higherHighs && lowerLows) || (lowerHighs && higherLows)) {
    structure = 'MIXED';
  }

  // Determine trend
  let trend: 'uptrend' | 'downtrend' | 'range' = 'range';
  if (structure === 'HH_HL') {
    trend = 'uptrend';
  } else if (structure === 'LH_LL') {
    trend = 'downtrend';
  }

  return {
    trend,
    higherHighs,
    higherLows,
    lowerHighs,
    lowerLows,
    structure,
  };
}

/**
 * Analyze VWAP positioning
 */
export function analyzeVWAP(candles: CandleData[]): VWAPAnalysis {
  if (candles.length === 0) {
    return {
      priceVsVWAP: 'at',
      distance: 0,
      strength: 'weak',
    };
  }

  const vwap = calculateVWAP(candles);
  const currentPrice = candles[candles.length - 1].close;
  const currentVWAP = vwap[vwap.length - 1];

  const distance = ((currentPrice - currentVWAP) / currentVWAP) * 100;
  const absDistance = Math.abs(distance);

  let priceVsVWAP: 'above' | 'below' | 'at';
  if (distance > 0.1) {
    priceVsVWAP = 'above';
  } else if (distance < -0.1) {
    priceVsVWAP = 'below';
  } else {
    priceVsVWAP = 'at';
  }

  let strength: 'strong' | 'moderate' | 'weak';
  if (absDistance > 1) {
    strength = 'strong';
  } else if (absDistance > 0.5) {
    strength = 'moderate';
  } else {
    strength = 'weak';
  }

  return {
    priceVsVWAP,
    distance,
    strength,
  };
}

/**
 * Analyze breakouts
 */
export function analyzeBreakout(
  candles: CandleData[],
  lookback: number = 20
): BreakoutAnalysis {
  if (candles.length < lookback + 1) {
    return {
      isBreakout: false,
      direction: null,
      strength: 'weak',
    };
  }

  const recent = candles.slice(-lookback - 1);
  const current = recent[recent.length - 1];
  const previous = recent.slice(0, -1);

  // Find resistance (highest high) and support (lowest low) in lookback period
  const resistance = Math.max(...previous.map(c => c.high));
  const support = Math.min(...previous.map(c => c.low));
  const range = resistance - support;

  if (range === 0) {
    return {
      isBreakout: false,
      direction: null,
      strength: 'weak',
    };
  }

  // Check for breakout
  const breakoutThreshold = range * 0.02; // 2% of range
  let isBreakout = false;
  let direction: 'up' | 'down' | null = null;
  let strength: 'strong' | 'moderate' | 'weak' = 'weak';

  // Upward breakout
  if (current.close > resistance + breakoutThreshold) {
    isBreakout = true;
    direction = 'up';
    const breakoutDistance = ((current.close - resistance) / range) * 100;
    if (breakoutDistance > 3) {
      strength = 'strong';
    } else if (breakoutDistance > 1.5) {
      strength = 'moderate';
    }
  }
  // Downward breakout
  else if (current.close < support - breakoutThreshold) {
    isBreakout = true;
    direction = 'down';
    const breakoutDistance = ((support - current.close) / range) * 100;
    if (breakoutDistance > 3) {
      strength = 'strong';
    } else if (breakoutDistance > 1.5) {
      strength = 'moderate';
    }
  }

  return {
    isBreakout,
    direction,
    strength,
    resistance,
    support,
  };
}

