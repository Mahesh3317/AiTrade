import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface MarketAnalysisData {
  timeframe: '1m' | '5m' | '15m';
  priceAction: {
    structure: string;
    vwapPosition: string;
    breakout: string;
  };
  indicators: {
    ema9: number;
    ema21: number;
    ema50: number;
    rsi: number;
    macd: number;
    bollinger: {
      upper: number;
      middle: number;
      lower: number;
    };
    supertrend: {
      value: number;
      trend: string;
    };
  };
  optionChain: {
    deltaBuildup: string;
    gammaExposure: string;
    thetaDecay: string;
    ivRegime: string;
    pcr: number;
  };
  sentiment: {
    bias: string;
    momentum: string;
    volatility: string;
    trendType: string;
  };
  candlestick: string | null;
  currentPrice: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GROQ_API_KEY) {
      console.error('[AI] GROQ_API_KEY not set');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'AI API key not configured',
          fallback: true
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const analysisData: MarketAnalysisData = await req.json();
    const { timeframe, priceAction, indicators, optionChain, sentiment, candlestick, currentPrice } = analysisData;

    // Build comprehensive prompt for AI
    const systemPrompt = `You are an expert AI trading analyst specializing in Indian F&O markets. 
Your role is to analyze market data and provide PROBABILISTIC insights, NOT guarantees.
Always use language like "higher probability", "likely range", "if momentum sustains".
NEVER use words like "guaranteed", "sure shot", "100% certain", or "definitely".

Analyze the provided market data and give:
1. Market bias (Bullish/Bearish/Neutral)
2. Confidence strength (Low/Medium/High)
3. Probable next price range (upper and lower bounds)
4. Reasoning based on all provided indicators`;

    const userPrompt = `Analyze this ${timeframe} timeframe market data:

CURRENT PRICE: ${currentPrice}

PRICE ACTION:
- Market Structure: ${priceAction.structure}
- VWAP Position: ${priceAction.vwapPosition}
- Breakout Status: ${priceAction.breakout}

TECHNICAL INDICATORS:
- EMA 9: ${indicators.ema9.toFixed(2)}
- EMA 21: ${indicators.ema21.toFixed(2)}
- EMA 50: ${indicators.ema50.toFixed(2)}
- RSI: ${indicators.rsi.toFixed(2)}
- MACD: ${indicators.macd.toFixed(2)}
- Bollinger Bands: Upper ${indicators.bollinger.upper.toFixed(2)}, Middle ${indicators.bollinger.middle.toFixed(2)}, Lower ${indicators.bollinger.lower.toFixed(2)}
- Supertrend: ${indicators.supertrend.value.toFixed(2)} (${indicators.supertrend.trend})

OPTION CHAIN & GREEKS:
- Delta Buildup: ${optionChain.deltaBuildup}
- Gamma Exposure: ${optionChain.gammaExposure}
- Theta Decay: ${optionChain.thetaDecay}
- IV Regime: ${optionChain.ivRegime}
- Put/Call Ratio: ${optionChain.pcr.toFixed(2)}

MARKET SENTIMENT:
- Bias: ${sentiment.bias}
- Momentum: ${sentiment.momentum}
- Volatility: ${sentiment.volatility}
- Trend Type: ${sentiment.trendType}

${candlestick ? `CANDLESTICK PATTERN: ${candlestick}` : ''}

Based on ALL this data, provide:
1. Market Bias (Bullish/Bearish/Neutral)
2. Confidence Strength (Low/Medium/High)
3. Probable Next Price Range (upper and lower bounds as percentages from current price)
4. Detailed reasoning explaining how each factor contributes to your analysis

Format your response as JSON:
{
  "bias": "bullish|bearish|neutral",
  "confidence": "low|medium|high",
  "priceRange": {
    "upper": <percentage above current>,
    "lower": <percentage below current>
  },
  "reasoning": "<detailed explanation>"
}`;

    console.log('[AI] Calling Groq API for', timeframe, 'analysis');

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI] Groq API error:', response.status, errorText);
      throw new Error(`Groq API returned ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse JSON response
    let analysisResult;
    try {
      analysisResult = JSON.parse(content);
    } catch (e) {
      // If JSON parsing fails, extract key info from text
      console.warn('[AI] Failed to parse JSON, using fallback');
      analysisResult = {
        bias: 'neutral',
        confidence: 'low',
        priceRange: { upper: 0.5, lower: -0.5 },
        reasoning: content
      };
    }

    console.log('[AI] Analysis complete for', timeframe);

    return new Response(
      JSON.stringify({
        success: true,
        timeframe,
        ...analysisResult,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AI] Error:', errorMessage);
    
    // Return fallback analysis
    return new Response(
      JSON.stringify({
        success: false,
        fallback: true,
        bias: 'neutral',
        confidence: 'low',
        priceRange: { upper: 0.5, lower: -0.5 },
        reasoning: 'AI analysis unavailable. Using rule-based fallback.',
        error: errorMessage,
      }),
      {
        status: 200, // Return 200 with fallback
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

