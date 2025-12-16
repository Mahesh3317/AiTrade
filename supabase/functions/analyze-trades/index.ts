import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, tradeId } = await req.json();
    console.log('Analyzing trades for user:', userId, 'tradeId:', tradeId);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch trades to analyze
    let query = supabase.from('trades').select('*').eq('user_id', userId).order('entry_time', { ascending: false });
    
    if (tradeId) {
      query = query.eq('id', tradeId);
    } else {
      query = query.limit(50);
    }

    const { data: trades, error: tradesError } = await query;

    if (tradesError) {
      console.error('Error fetching trades:', tradesError);
      throw tradesError;
    }

    if (!trades || trades.length === 0) {
      return new Response(JSON.stringify({ message: 'No trades to analyze' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${trades.length} trades to analyze`);

    // Prepare trading data summary for AI
    const tradeSummary = trades.map(t => ({
      symbol: t.symbol,
      side: t.side,
      quantity: t.quantity,
      entry_price: t.avg_price,
      exit_price: t.exit_price,
      pnl: t.pnl,
      entry_time: t.entry_time,
      exit_time: t.exit_time,
      holding_duration: t.exit_time && t.entry_time 
        ? (new Date(t.exit_time).getTime() - new Date(t.entry_time).getTime()) / (1000 * 60) 
        : null,
    }));

    // Calculate patterns
    const totalTrades = trades.length;
    const lossTrades = trades.filter(t => (t.pnl || 0) < 0);
    const consecutiveLosses = countConsecutiveLosses(trades);
    const avgHoldingTime = calculateAvgHoldingTime(trades);
    const tradeFrequency = calculateTradeFrequency(trades);

    const systemPrompt = `You are an expert trading psychologist analyzing F&O (Futures & Options) trading patterns. 
    Analyze the provided trades and identify psychological patterns like:
    - FOMO (Fear of Missing Out): Entering trades impulsively after big moves
    - Revenge Trading: Quick re-entries after losses to recover
    - Overtrading: Too many trades in a short period
    - Greed: Not booking profits, letting winners turn to losers
    - Fear: Exiting too early, small profits but large losses
    - Emotional Trading: Inconsistent position sizing, random entries
    
    Provide specific, actionable suggestions for each identified pattern.
    Be encouraging but honest. Use simple language a retail trader would understand.`;

    const analysisPrompt = `Analyze these ${totalTrades} F&O trades:

Trade Data:
${JSON.stringify(tradeSummary.slice(0, 20), null, 2)}

Statistics:
- Total Trades: ${totalTrades}
- Loss Trades: ${lossTrades.length} (${((lossTrades.length/totalTrades)*100).toFixed(1)}%)
- Max Consecutive Losses: ${consecutiveLosses}
- Avg Holding Time: ${avgHoldingTime} minutes
- Trade Frequency: ${tradeFrequency} trades/day

For each trade, identify:
1. Psychology tags (FOMO, REVENGE, GREED, FEAR, OVERTRADING, DISCIPLINED)
2. Emotion score (1-10, 10 being most emotional)
3. Specific suggestion for improvement

Return JSON format:
{
  "overall_analysis": "summary of trading psychology",
  "key_issues": ["issue1", "issue2"],
  "trades": [
    {
      "index": 0,
      "psychology_tags": ["TAG1", "TAG2"],
      "emotion_score": 7,
      "greed": false,
      "fear": true,
      "fomo": false,
      "revenge": false,
      "overtrading": false,
      "suggestion": "specific advice for this trade"
    }
  ],
  "action_plan": ["step 1", "step 2", "step 3"]
}`;

    // Call Lovable AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;
    console.log('AI Analysis received');

    // Parse AI response
    interface AnalysisResult {
      overall_analysis: string;
      trades: Array<{
        psychology_tags?: string[];
        emotion_score?: number;
        greed?: boolean;
        fear?: boolean;
        fomo?: boolean;
        revenge?: boolean;
        overtrading?: boolean;
        suggestion?: string;
      }>;
      key_issues: string[];
      action_plan: string[];
    }

    let analysis: AnalysisResult = {
      overall_analysis: analysisText,
      trades: [],
      key_issues: [],
      action_plan: []
    };

    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
    }

    // Store analysis results
    const analysisInserts = trades.slice(0, 20).map((trade, index) => {
      const tradeAnalysis = analysis.trades?.[index] || {};
      return {
        trade_id: trade.id,
        user_id: userId,
        psychology_tags: tradeAnalysis.psychology_tags || [],
        emotion_score: tradeAnalysis.emotion_score || 5,
        greed_indicator: tradeAnalysis.greed || false,
        fear_indicator: tradeAnalysis.fear || false,
        fomo_indicator: tradeAnalysis.fomo || false,
        revenge_trade: tradeAnalysis.revenge || false,
        overtrading: tradeAnalysis.overtrading || false,
        ai_suggestion: tradeAnalysis.suggestion || '',
        ai_analysis: analysis.overall_analysis || '',
      };
    });

    // Upsert analysis
    for (const item of analysisInserts) {
      const { error: insertError } = await supabase
        .from('trade_analysis')
        .upsert(item, { onConflict: 'trade_id' });
      
      if (insertError) {
        console.error('Error inserting analysis:', insertError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      analyzed: analysisInserts.length,
      overall_analysis: analysis.overall_analysis,
      key_issues: analysis.key_issues,
      action_plan: analysis.action_plan,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in analyze-trades:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function countConsecutiveLosses(trades: any[]): number {
  let maxConsec = 0;
  let current = 0;
  for (const trade of trades) {
    if ((trade.pnl || 0) < 0) {
      current++;
      maxConsec = Math.max(maxConsec, current);
    } else {
      current = 0;
    }
  }
  return maxConsec;
}

function calculateAvgHoldingTime(trades: any[]): number {
  const withExits = trades.filter(t => t.exit_time && t.entry_time);
  if (withExits.length === 0) return 0;
  
  const totalMinutes = withExits.reduce((sum, t) => {
    return sum + (new Date(t.exit_time).getTime() - new Date(t.entry_time).getTime()) / (1000 * 60);
  }, 0);
  
  return Math.round(totalMinutes / withExits.length);
}

function calculateTradeFrequency(trades: any[]): number {
  if (trades.length < 2) return trades.length;
  
  const dates = [...new Set(trades.map(t => new Date(t.entry_time).toDateString()))];
  return Math.round((trades.length / dates.length) * 10) / 10;
}
