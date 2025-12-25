/**
 * AI Analysis Component
 * Displays probabilistic market analysis with price range predictions for 1m, 5m, 15m timeframes
 */

import { AIAnalysisResult } from '@/hooks/useAIAnalysis';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, Info, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AIAnalysisProps {
  analysis: Record<string, AIAnalysisResult>;
  loading?: Record<string, boolean>;
  spotPrice: number;
}

export function AIAnalysis({ analysis, loading = {}, spotPrice }: AIAnalysisProps) {
  const timeframes: ('1m' | '5m' | '15m')[] = ['1m', '5m', '15m'];
  const isLoading = Object.values(loading).some(l => l);
  const hasAnalysis = Object.keys(analysis).length > 0;

  const getBiasIcon = (bias: string) => {
    if (bias === 'bullish') return <TrendingUp className="h-4 w-4 text-profit" />;
    if (bias === 'bearish') return <TrendingDown className="h-4 w-4 text-loss" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getBiasColor = (bias: string) => {
    if (bias === 'bullish') return 'text-profit border-profit';
    if (bias === 'bearish') return 'text-loss border-loss';
    return 'text-muted-foreground border-muted-foreground';
  };

  const getConfidenceColor = (confidence: string) => {
    if (confidence === 'high') return 'bg-profit/20 text-profit border-profit/50';
    if (confidence === 'medium') return 'bg-warning/20 text-warning border-warning/50';
    return 'bg-muted/20 text-muted-foreground border-muted-foreground/50';
  };

  const calculatePriceRange = (result: AIAnalysisResult) => {
    const upperPrice = spotPrice * (1 + result.priceRange.upper / 100);
    const lowerPrice = spotPrice * (1 + result.priceRange.lower / 100);
    return { upperPrice, lowerPrice };
  };

  return (
    <Card className="stat-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          AI Market Analysis
        </CardTitle>
        <CardDescription>
          Probabilistic price range predictions across multiple timeframes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Disclaimer */}
        <Alert className="border-warning/50 bg-warning/10">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            This is a probabilistic analysis, not financial advice. Price ranges are estimates based on market data analysis, not guarantees.
          </AlertDescription>
        </Alert>

        {/* Analysis for each timeframe */}
        {timeframes.map((timeframe) => {
          const result = analysis[timeframe];
          const isTimeframeLoading = loading[timeframe];

          if (isTimeframeLoading) {
            return (
              <div
                key={timeframe}
                className="rounded-lg border border-border bg-card/50 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-foreground">
                    AI Market Read – {timeframe.toUpperCase()}
                  </h4>
                  <Brain className="h-4 w-4 animate-pulse text-purple-500" />
                </div>
                <p className="text-sm text-muted-foreground">Analyzing...</p>
              </div>
            );
          }

          if (!result) {
            return (
              <div
                key={timeframe}
                className="rounded-lg border border-border bg-card/50 p-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">
                    AI Market Read – {timeframe.toUpperCase()}
                  </h4>
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    Waiting for data
                  </Badge>
                </div>
              </div>
            );
          }

          const { upperPrice, lowerPrice } = calculatePriceRange(result);

          return (
            <div
              key={timeframe}
              className="rounded-lg border border-border bg-card/50 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-foreground">
                  AI Market Read – {timeframe.toUpperCase()}
                </h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn('text-xs', getBiasColor(result.bias))}>
                    {getBiasIcon(result.bias)}
                    <span className="ml-1 capitalize">{result.bias}</span>
                  </Badge>
                  {result.fallback && (
                    <Badge variant="outline" className="text-xs text-warning">
                      Fallback
                    </Badge>
                  )}
                </div>
              </div>

              {/* Confidence */}
              <div>
                <span className="text-muted-foreground text-sm">Confidence:</span>
                <Badge variant="outline" className={cn('ml-2 text-xs', getConfidenceColor(result.confidence))}>
                  {result.confidence.charAt(0).toUpperCase() + result.confidence.slice(1)}
                </Badge>
              </div>

              {/* Probable Price Range */}
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Probable Next Price Range:</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-profit/10 border border-profit/30 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Upper Zone</p>
                    <p className="text-lg font-mono font-bold text-profit">
                      ₹{upperPrice.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      +{result.priceRange.upper.toFixed(2)}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-loss/10 border border-loss/30 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Lower Zone</p>
                    <p className="text-lg font-mono font-bold text-loss">
                      ₹{lowerPrice.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {result.priceRange.lower.toFixed(2)}%
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 italic">
                  Based on current price: ₹{spotPrice.toFixed(2)}
                </p>
              </div>

              {/* Reasoning */}
              <div className="pt-2 border-t border-border/50">
                <p className="text-sm font-medium text-foreground mb-2">AI Reasoning:</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{result.reasoning}</p>
              </div>

              {/* Timestamp */}
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date(result.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          );
        })}

        {!hasAnalysis && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Waiting for market data to generate AI analysis...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
