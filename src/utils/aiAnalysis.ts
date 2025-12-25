/**
 * AI Market Analysis Engine
 * Combines all technical analysis to generate probabilistic market insights
 */

import { CandleData, calculateEMAs, calculateRSI, calculateMACD, calculateBollingerBands, calculateSupertrend, calculateVWAP } from './technicalIndicators';
import { detectCandlestickPatterns } from './candlestickPatterns';
import { analyzeMarketStructure, analyzeVWAP, analyzeBreakout } from './priceAction';
import { OptionData } from '@/data/optionChainData';

export interface OptionChainAnalysis {
  deltaBuildup: 'call' | 'put' | 'balanced';
  gammaExposure: 'high' | 'moderate' | 'low';
  thetaDecay: 'high' | 'moderate' | 'low';
  ivRegime: 'expanding' | 'contracting' | 'stable';
  pcr: number;
  maxPain: number;
  atmStrike: number;
}

export interface MarketSentiment {
  bias: 'bullish' | 'bearish' | 'neutral';
  momentumStrength: 'weak' | 'moderate' | 'strong';
  volatilityRegime: 'low' | 'moderate' | 'high';
  trendType: 'trending' | 'range_bound';
}

export interface AIAnalysisResult {
  timeframe: '1m' | '5m' | '15m';
  bias: 'bullish' | 'bearish' | 'neutral';
  momentumStrength: 'weak' | 'moderate' | 'strong';
  optionWriterPressure: 'CE' | 'PE' | 'balanced';
  greeksInsight: string;
  candlestickInsight: string | null;
  volatility: 'expanding' | 'contracting' | 'stable';
  inference: string;
  riskLevel: 'low' | 'medium' | 'high';
  suggestedStrategy: 'scalping' | 'intraday' | 'avoid_trade';
}

/**
 * Analyze option chain for Greeks insights
 */
export function analyzeOptionChain(optionChain: OptionData[], spotPrice: number): OptionChainAnalysis {
  if (optionChain.length === 0) {
    return {
      deltaBuildup: 'balanced',
      gammaExposure: 'low',
      thetaDecay: 'low',
      ivRegime: 'stable',
      pcr: 1,
      maxPain: spotPrice,
      atmStrike: spotPrice,
    };
  }

  // Find ATM strike
  const atmStrike = optionChain.reduce((prev, curr) => 
    Math.abs(curr.strike - spotPrice) < Math.abs(prev.strike - spotPrice) ? curr : prev
  ).strike;

  // Calculate delta buildup
  let totalCallDelta = 0;
  let totalPutDelta = 0;
  let totalGamma = 0;
  let totalTheta = 0;

  optionChain.forEach(option => {
    const distanceFromATM = Math.abs(option.strike - atmStrike);
    const isNearATM = distanceFromATM < (spotPrice * 0.02); // Within 2% of ATM

    totalCallDelta += option.callDelta * option.callOI;
    totalPutDelta += Math.abs(option.putDelta) * option.putOI;
    
    if (isNearATM) {
      totalGamma += (option.callGamma + option.putGamma) * (option.callOI + option.putOI);
    }
    
    totalTheta += Math.abs(option.callTheta) * option.callOI + Math.abs(option.putTheta) * option.putOI;
  });

  const deltaBuildup = totalCallDelta > totalPutDelta * 1.2 ? 'call' : 
                       totalPutDelta > totalCallDelta * 1.2 ? 'put' : 'balanced';

  const gammaExposure = totalGamma > 1000000 ? 'high' : totalGamma > 500000 ? 'moderate' : 'low';
  const thetaDecay = totalTheta > 500000 ? 'high' : totalTheta > 200000 ? 'moderate' : 'low';

  // Analyze IV
  const avgIV = optionChain.reduce((sum, opt) => sum + opt.callIV + opt.putIV, 0) / (optionChain.length * 2);
  const ivRegime = avgIV > 20 ? 'expanding' : avgIV < 12 ? 'contracting' : 'stable';

  // Calculate PCR
  const totalCallOI = optionChain.reduce((sum, opt) => sum + opt.callOI, 0);
  const totalPutOI = optionChain.reduce((sum, opt) => sum + opt.putOI, 0);
  const pcr = totalCallOI > 0 ? totalPutOI / totalCallOI : 1;

  // Find max pain (strike with highest OI)
  const maxPain = optionChain.reduce((prev, curr) => 
    (curr.callOI + curr.putOI) > (prev.callOI + prev.putOI) ? curr : prev
  ).strike;

  return {
    deltaBuildup,
    gammaExposure,
    thetaDecay,
    ivRegime,
    pcr,
    maxPain,
    atmStrike,
  };
}

/**
 * Determine market sentiment
 */
function determineMarketSentiment(
  structure: ReturnType<typeof analyzeMarketStructure>,
  rsi: ReturnType<typeof calculateRSI>,
  macd: ReturnType<typeof calculateMACD>,
  supertrend: ReturnType<typeof calculateSupertrend>,
  vwap: ReturnType<typeof analyzeVWAP>
): MarketSentiment {
  const latestRSI = rsi[rsi.length - 1];
  const latestMACD = macd[macd.length - 1];
  const latestSupertrend = supertrend[supertrend.length - 1];

  // Determine bias
  let bias: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  let bullishSignals = 0;
  let bearishSignals = 0;

  if (structure.trend === 'uptrend') bullishSignals++;
  else if (structure.trend === 'downtrend') bearishSignals++;

  if (latestRSI.rsi > 50) bullishSignals++;
  else if (latestRSI.rsi < 50) bearishSignals++;

  if (latestMACD.histogram > 0) bullishSignals++;
  else if (latestMACD.histogram < 0) bearishSignals++;

  if (latestSupertrend.trend === 'up') bullishSignals++;
  else bearishSignals++;

  if (vwap.priceVsVWAP === 'above') bullishSignals++;
  else if (vwap.priceVsVWAP === 'below') bearishSignals++;

  if (bullishSignals > bearishSignals + 1) bias = 'bullish';
  else if (bearishSignals > bullishSignals + 1) bias = 'bearish';

  // Determine momentum strength
  const rsiStrength = Math.abs(latestRSI.rsi - 50) / 50;
  const macdStrength = Math.abs(latestMACD.histogram) / Math.max(Math.abs(latestMACD.macd), 1);
  const momentumScore = (rsiStrength + macdStrength) / 2;

  const momentumStrength: 'weak' | 'moderate' | 'strong' = 
    momentumScore > 0.6 ? 'strong' : momentumScore > 0.3 ? 'moderate' : 'weak';

  // Determine volatility regime (using RSI range as proxy)
  const rsiRange = Math.max(...rsi.map(r => r.rsi)) - Math.min(...rsi.map(r => r.rsi));
  const volatilityRegime: 'low' | 'moderate' | 'high' = 
    rsiRange > 40 ? 'high' : rsiRange > 20 ? 'moderate' : 'low';

  // Determine trend type
  const trendType: 'trending' | 'range_bound' = 
    structure.structure === 'HH_HL' || structure.structure === 'LH_LL' ? 'trending' : 'range_bound';

  return {
    bias,
    momentumStrength,
    volatilityRegime,
    trendType,
  };
}

/**
 * Generate AI Analysis for a specific timeframe
 */
export function generateAIAnalysis(
  candles: CandleData[],
  optionChain: OptionData[],
  spotPrice: number,
  timeframe: '1m' | '5m' | '15m'
): AIAnalysisResult {
  if (candles.length < 20) {
    return {
      timeframe,
      bias: 'neutral',
      momentumStrength: 'weak',
      optionWriterPressure: 'balanced',
      greeksInsight: 'Insufficient data for analysis',
      candlestickInsight: null,
      volatility: 'stable',
      inference: 'Waiting for more data to generate analysis.',
      riskLevel: 'high',
      suggestedStrategy: 'avoid_trade',
    };
  }

  // Calculate all technical indicators
  const emas = calculateEMAs(candles);
  const rsi = calculateRSI(candles.map(c => c.close));
  const macd = calculateMACD(candles.map(c => c.close));
  const bollinger = calculateBollingerBands(candles.map(c => c.close));
  const supertrend = calculateSupertrend(candles);
  const vwap = analyzeVWAP(candles);

  // Analyze price action
  const structure = analyzeMarketStructure(candles);
  const breakout = analyzeBreakout(candles);

  // Detect candlestick patterns
  const pattern = detectCandlestickPatterns(candles);

  // Analyze option chain
  const optionAnalysis = analyzeOptionChain(optionChain, spotPrice);

  // Determine market sentiment
  const sentiment = determineMarketSentiment(structure, rsi, macd, supertrend, vwap);

  // Generate Greeks insight
  let greeksInsight = '';
  if (optionAnalysis.gammaExposure === 'high') {
    greeksInsight += 'High gamma exposure near ATM → fast moves expected. ';
  }
  if (optionAnalysis.deltaBuildup === 'call') {
    greeksInsight += 'Delta: Positive call buildup. ';
  } else if (optionAnalysis.deltaBuildup === 'put') {
    greeksInsight += 'Delta: Put buildup indicating hedging. ';
  }
  if (optionAnalysis.thetaDecay === 'high') {
    greeksInsight += 'Theta: Favoring option sellers. ';
  }

  // Generate inference
  let inference = '';
  if (sentiment.bias === 'bullish' && vwap.priceVsVWAP === 'above') {
    inference = 'Market shows higher probability of upside continuation if price sustains above VWAP.';
  } else if (sentiment.bias === 'bearish' && vwap.priceVsVWAP === 'below') {
    inference = 'Market shows higher probability of downside continuation if price remains below VWAP.';
  } else if (breakout.isBreakout && breakout.direction) {
    inference = `${breakout.direction === 'up' ? 'Upward' : 'Downward'} breakout detected with ${breakout.strength} strength. Monitor for continuation.`;
  } else if (structure.structure === 'MIXED') {
    inference = 'Mixed market structure suggests range-bound movement. Wait for clear directional bias.';
  } else {
    inference = 'Market structure is neutral. Monitor key levels for directional confirmation.';
  }

  // Determine option writer pressure
  let optionWriterPressure: 'CE' | 'PE' | 'balanced' = 'balanced';
  if (optionAnalysis.pcr > 1.2) {
    optionWriterPressure = 'PE'; // More put OI, call writers active
  } else if (optionAnalysis.pcr < 0.8) {
    optionWriterPressure = 'CE'; // More call OI, put writers active
  }

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'medium';
  if (optionAnalysis.gammaExposure === 'high' || optionAnalysis.ivRegime === 'expanding') {
    riskLevel = 'high';
  } else if (sentiment.volatilityRegime === 'low' && sentiment.momentumStrength === 'weak') {
    riskLevel = 'low';
  }

  // Determine suggested strategy
  let suggestedStrategy: 'scalping' | 'intraday' | 'avoid_trade' = 'intraday';
  if (timeframe === '1m' && sentiment.momentumStrength === 'strong') {
    suggestedStrategy = 'scalping';
  } else if (riskLevel === 'high' || sentiment.bias === 'neutral') {
    suggestedStrategy = 'avoid_trade';
  }

  return {
    timeframe,
    bias: sentiment.bias,
    momentumStrength: sentiment.momentumStrength,
    optionWriterPressure,
    greeksInsight: greeksInsight || 'Greeks analysis neutral.',
    candlestickInsight: pattern ? pattern.description : null,
    volatility: optionAnalysis.ivRegime,
    inference,
    riskLevel,
    suggestedStrategy,
  };
}

