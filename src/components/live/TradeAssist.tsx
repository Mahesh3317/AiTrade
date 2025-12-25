/**
 * Risk-Aware Trade Assist Panel
 * Provides probabilistic trade suggestions with risk warnings
 */

import { AIAnalysisResult } from '@/hooks/useAIAnalysis';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Target, AlertTriangle, Shield, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TradeAssistProps {
  analysis: AIAnalysisResult[];
  spotPrice: number;
  atmStrike?: number;
}

// Helper to get primary analysis (prefer 5m, fallback to 15m or first available)
function getPrimaryAnalysis(analysis: AIAnalysisResult[]): AIAnalysisResult | null {
  if (analysis.length === 0) return null;
  return analysis.find(a => a.timeframe === '5m') || 
         analysis.find(a => a.timeframe === '15m') || 
         analysis[0];
}

export function TradeAssist({ analysis, spotPrice, atmStrike }: TradeAssistProps) {
  const primaryAnalysis = getPrimaryAnalysis(analysis);
  
  if (!primaryAnalysis) {
    return null;
  }

  const getRiskColor = (risk: string) => {
    if (risk === 'high') return 'text-loss border-loss bg-loss/10';
    if (risk === 'medium') return 'text-warning border-warning bg-warning/10';
    return 'text-profit border-profit bg-profit/10';
  };

  const getStrategyColor = (strategy: string) => {
    if (strategy === 'avoid_trade') return 'text-loss';
    if (strategy === 'scalping') return 'text-warning';
    return 'text-profit';
  };

  // Derive risk level from confidence and price range
  const riskLevel = primaryAnalysis.confidence === 'low' ? 'high' : 
                   primaryAnalysis.confidence === 'medium' ? 'medium' : 'low';
  
  // Derive strategy from confidence and bias
  const suggestedStrategy = primaryAnalysis.confidence === 'low' ? 'avoid_trade' :
                           primaryAnalysis.timeframe === '1m' ? 'scalping' : 'intraday';

  // Generate stop-loss logic
  const getStopLossLogic = () => {
    if (riskLevel === 'high') {
      return 'Tight stop-loss recommended due to high uncertainty';
    }
    if (primaryAnalysis.bias === 'bullish') {
      return `Stop-loss below recent swing low or ${(spotPrice * 0.995).toFixed(0)} (0.5% below spot)`;
    }
    if (primaryAnalysis.bias === 'bearish') {
      return `Stop-loss above recent swing high or ${(spotPrice * 1.005).toFixed(0)} (0.5% above spot)`;
    }
    return 'Wider stop-loss recommended due to neutral bias';
  };

  // Generate warnings
  const warnings: string[] = [];
  if (riskLevel === 'high') {
    warnings.push('High uncertainty - use tight risk management');
  }
  if (primaryAnalysis.confidence === 'low') {
    warnings.push('Low confidence analysis - consider waiting for clearer signals');
  }
  const priceRangeSize = primaryAnalysis.priceRange.upper - primaryAnalysis.priceRange.lower;
  if (priceRangeSize > 2) {
    warnings.push('Wide price range suggests high volatility - adjust position sizing');
  }
  if (primaryAnalysis.fallback) {
    warnings.push('Using fallback analysis - AI unavailable');
  }

  return (
    <Card className="stat-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-500" />
          AI Trade Assist
        </CardTitle>
        <CardDescription>
          Probabilistic trade suggestions with risk management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Critical Disclaimer */}
        <Alert className="border-warning/50 bg-warning/10">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs font-medium">
            This is a probabilistic analysis, not financial advice. Always do your own research and risk management.
          </AlertDescription>
        </Alert>

        {/* Suggested Strategy */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Suggested Strategy Type:</span>
          </div>
          <Badge 
            variant="outline" 
            className={cn('text-sm px-3 py-1', getStrategyColor(suggestedStrategy))}
          >
            {suggestedStrategy === 'scalping' ? 'Scalping' : 
             suggestedStrategy === 'intraday' ? 'Intraday' : 
             'Avoid Trade'}
          </Badge>
        </div>

        {/* Risk Level */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Risk Level:</span>
          </div>
          <Badge 
            variant="outline" 
            className={cn('text-sm px-3 py-1', getRiskColor(riskLevel))}
          >
            {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
          </Badge>
        </div>

        {/* Stop-Loss Logic */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Stop-Loss Logic:</span>
          </div>
          <p className="text-sm text-muted-foreground pl-6">
            {getStopLossLogic()}
          </p>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium text-foreground">Warning Messages:</span>
            </div>
            <ul className="space-y-1 pl-6">
              {warnings.map((warning, idx) => (
                <li key={idx} className="text-sm text-warning text-xs flex items-start">
                  <span className="text-warning mr-2">•</span>
                  <span className="text-muted-foreground">{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Market Bias Summary */}
        <div className="pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-2">Current Market Bias:</p>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn(
              'text-xs',
              primaryAnalysis.bias === 'bullish' ? 'text-profit border-profit' :
              primaryAnalysis.bias === 'bearish' ? 'text-loss border-loss' :
              'text-muted-foreground border-muted-foreground'
            )}>
              {primaryAnalysis.bias.charAt(0).toUpperCase() + primaryAnalysis.bias.slice(1)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              ({primaryAnalysis.confidence} confidence)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

