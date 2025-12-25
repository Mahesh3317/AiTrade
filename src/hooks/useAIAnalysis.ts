/**
 * Hook for AI Analysis using Groq API
 * Handles automatic re-analysis at specified intervals
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CandleData } from '@/utils/technicalIndicators';
import { OptionData } from '@/data/optionChainData';
import { calculateEMAs, calculateRSI, calculateMACD, calculateBollingerBands, calculateSupertrend, calculateVWAP } from '@/utils/technicalIndicators';
import { detectCandlestickPatterns } from '@/utils/candlestickPatterns';
import { analyzeMarketStructure, analyzeVWAP, analyzeBreakout } from '@/utils/priceAction';
import { analyzeOptionChain } from '@/utils/aiAnalysis';

export interface AIAnalysisResult {
  timeframe: '1m' | '5m' | '15m';
  bias: 'bullish' | 'bearish' | 'neutral';
  confidence: 'low' | 'medium' | 'high';
  priceRange: {
    upper: number; // percentage above current
    lower: number; // percentage below current
  };
  reasoning: string;
  timestamp: string;
  fallback?: boolean;
}

export function useAIAnalysis() {
  const [analyses, setAnalyses] = useState<Record<string, AIAnalysisResult>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Record<string, number>>({});

  const analyzeTimeframe = useCallback(async (
    timeframe: '1m' | '5m' | '15m',
    candles: CandleData[],
    optionChain: OptionData[],
    spotPrice: number
  ): Promise<AIAnalysisResult | null> => {
    if (candles.length < 20 || optionChain.length === 0 || spotPrice === 0) {
      console.warn(`[AI] Insufficient data for ${timeframe} analysis`);
      return null;
    }

    setLoading(prev => ({ ...prev, [timeframe]: true }));

    try {
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

      // Prepare data for AI
      const latestEMA = emas[emas.length - 1];
      const latestRSI = rsi[rsi.length - 1];
      const latestMACD = macd[macd.length - 1];
      const latestBollinger = bollinger[bollinger.length - 1];
      const latestSupertrend = supertrend[supertrend.length - 1];

      const analysisData = {
        timeframe,
        priceAction: {
          structure: structure.structure,
          vwapPosition: vwap.priceVsVWAP,
          breakout: breakout.isBreakout ? `${breakout.direction} ${breakout.strength}` : 'none',
        },
        indicators: {
          ema9: latestEMA.ema9,
          ema21: latestEMA.ema21,
          ema50: latestEMA.ema50,
          rsi: latestRSI.rsi,
          macd: latestMACD.histogram,
          bollinger: {
            upper: latestBollinger.upper,
            middle: latestBollinger.middle,
            lower: latestBollinger.lower,
          },
          supertrend: {
            value: latestSupertrend.value,
            trend: latestSupertrend.trend,
          },
        },
        optionChain: {
          deltaBuildup: optionAnalysis.deltaBuildup,
          gammaExposure: optionAnalysis.gammaExposure,
          thetaDecay: optionAnalysis.thetaDecay,
          ivRegime: optionAnalysis.ivRegime,
          pcr: optionAnalysis.pcr,
        },
        sentiment: {
          bias: structure.trend === 'uptrend' ? 'bullish' : structure.trend === 'downtrend' ? 'bearish' : 'neutral',
          momentum: latestRSI.rsi > 70 ? 'strong' : latestRSI.rsi < 30 ? 'strong' : 'moderate',
          volatility: optionAnalysis.ivRegime === 'expanding' ? 'high' : optionAnalysis.ivRegime === 'contracting' ? 'low' : 'moderate',
          trendType: structure.trendType,
        },
        candlestick: pattern ? pattern.description : null,
        currentPrice: spotPrice,
      };

      console.log(`[AI] Calling AI analysis for ${timeframe}`);

      // Call Groq AI backend
      const { data: aiResponse, error } = await supabase.functions.invoke('ai-analysis', {
        body: analysisData,
      });

      if (error) {
        console.error(`[AI] Error calling AI for ${timeframe}:`, error);
        throw error;
      }

      if (!aiResponse || !aiResponse.success) {
        console.warn(`[AI] AI analysis failed for ${timeframe}, using fallback`);
        // Use fallback rule-based analysis
        return {
          timeframe,
          bias: analysisData.sentiment.bias as 'bullish' | 'bearish' | 'neutral',
          confidence: 'low' as const,
          priceRange: {
            upper: 0.5,
            lower: -0.5,
          },
          reasoning: 'AI analysis unavailable. Market structure suggests neutral bias.',
          timestamp: new Date().toISOString(),
          fallback: true,
        };
      }

      const result: AIAnalysisResult = {
        timeframe: aiResponse.timeframe || timeframe,
        bias: aiResponse.bias || 'neutral',
        confidence: aiResponse.confidence || 'low',
        priceRange: aiResponse.priceRange || { upper: 0.5, lower: -0.5 },
        reasoning: aiResponse.reasoning || 'Analysis complete',
        timestamp: aiResponse.timestamp || new Date().toISOString(),
        fallback: aiResponse.fallback || false,
      };

      setAnalyses(prev => ({ ...prev, [timeframe]: result }));
      setLastAnalysisTime(prev => ({ ...prev, [timeframe]: Date.now() }));

      return result;

    } catch (err) {
      console.error(`[AI] Error in ${timeframe} analysis:`, err);
      return null;
    } finally {
      setLoading(prev => ({ ...prev, [timeframe]: false }));
    }
  }, []);

  return {
    analyses,
    loading,
    lastAnalysisTime,
    analyzeTimeframe,
  };
}

