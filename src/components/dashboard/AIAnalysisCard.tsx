import { useEffect, useState } from 'react';
import { Brain, AlertTriangle, TrendingUp, Lightbulb, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TradeAnalysis {
  id: string;
  psychology_tags: string[];
  emotion_score: number;
  greed_indicator: boolean;
  fear_indicator: boolean;
  fomo_indicator: boolean;
  revenge_trade: boolean;
  overtrading: boolean;
  ai_suggestion: string;
  ai_analysis: string;
}

export function AIAnalysisCard() {
  const [analyses, setAnalyses] = useState<TradeAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from('trade_analysis')
        .select('*')
        .eq('user_id', 'demo-user')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error('Error fetching analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const handleRefreshAnalysis = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-trades', {
        body: { userId: 'demo-user' },
      });

      if (error) throw error;

      toast({
        title: 'Analysis Updated',
        description: `Analyzed ${data.analyzed} trades`,
      });

      fetchAnalysis();
    } catch (error) {
      console.error('Error refreshing analysis:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Unable to refresh AI analysis',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Aggregate psychology indicators
  const totalAnalyses = analyses.length;
  const fomoCount = analyses.filter(a => a.fomo_indicator).length;
  const revengeCount = analyses.filter(a => a.revenge_trade).length;
  const greedCount = analyses.filter(a => a.greed_indicator).length;
  const fearCount = analyses.filter(a => a.fear_indicator).length;
  const overtradingCount = analyses.filter(a => a.overtrading).length;
  const avgEmotionScore = totalAnalyses > 0 
    ? Math.round(analyses.reduce((sum, a) => sum + (a.emotion_score || 5), 0) / totalAnalyses)
    : 5;

  const topIssues = [
    { label: 'FOMO', count: fomoCount, color: 'bg-orange-500/20 text-orange-400' },
    { label: 'Revenge', count: revengeCount, color: 'bg-red-500/20 text-red-400' },
    { label: 'Greed', count: greedCount, color: 'bg-yellow-500/20 text-yellow-400' },
    { label: 'Fear', count: fearCount, color: 'bg-blue-500/20 text-blue-400' },
    { label: 'Overtrading', count: overtradingCount, color: 'bg-purple-500/20 text-purple-400' },
  ].filter(i => i.count > 0).sort((a, b) => b.count - a.count);

  const latestAnalysis = analyses[0]?.ai_analysis || '';

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Psychology Analysis
          </CardTitle>
          <CardDescription>Trading behavior patterns detected by AI</CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefreshAnalysis}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : totalAnalyses === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No trades analyzed yet</p>
            <p className="text-sm">Import trades to get AI-powered psychology insights</p>
          </div>
        ) : (
          <>
            {/* Emotion Score */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div>
                <p className="text-sm text-muted-foreground">Average Emotion Score</p>
                <p className="text-2xl font-bold">{avgEmotionScore}/10</p>
              </div>
              <div className={`text-4xl ${avgEmotionScore <= 4 ? '🧘' : avgEmotionScore <= 6 ? '😐' : '😰'}`}>
                {avgEmotionScore <= 4 ? '🧘' : avgEmotionScore <= 6 ? '😐' : '😰'}
              </div>
            </div>

            {/* Top Issues */}
            {topIssues.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-loss" />
                  Detected Patterns
                </p>
                <div className="flex flex-wrap gap-2">
                  {topIssues.map((issue) => (
                    <Badge key={issue.label} variant="secondary" className={issue.color}>
                      {issue.label} ({issue.count})
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* AI Insight */}
            {latestAnalysis && (
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                <p className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  AI Insight
                </p>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {latestAnalysis}
                </p>
              </div>
            )}

            {/* Recent Suggestions */}
            {analyses.slice(0, 3).map((analysis, i) => (
              analysis.ai_suggestion && (
                <div key={analysis.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
                  <TrendingUp className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm text-muted-foreground">{analysis.ai_suggestion}</p>
                </div>
              )
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
