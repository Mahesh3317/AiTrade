import { BarChart3, ArrowUpRight, ArrowDownRight, Target } from 'lucide-react';
import { OIAnalysis } from '@/data/optionChainData';

interface OIAnalysisCardProps {
  data: OIAnalysis;
}

export function OIAnalysisCard({ data }: OIAnalysisCardProps) {
  const formatNumber = (num: number) => {
    if (num >= 10000000) return (num / 10000000).toFixed(2) + ' Cr';
    if (num >= 100000) return (num / 100000).toFixed(2) + ' L';
    return num.toLocaleString('en-IN');
  };
  
  const getPCRColor = (pcr: number) => {
    if (pcr > 1.2) return 'text-profit';
    if (pcr < 0.8) return 'text-loss';
    return 'text-warning';
  };
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'bullish': return <ArrowUpRight className="h-4 w-4 text-profit" />;
      case 'bearish': return <ArrowDownRight className="h-4 w-4 text-loss" />;
      default: return null;
    }
  };
  
  return (
    <div className="stat-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-chart-2/10">
          <BarChart3 className="h-5 w-5 text-chart-2" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">OI Analysis</h3>
          <p className="text-xs text-muted-foreground">Open Interest Build-up</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-warning" />
            <span className="text-sm text-muted-foreground">Max Pain</span>
          </div>
          <span className="font-mono font-bold text-warning">{data.maxPainStrike.toLocaleString('en-IN')}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Put/Call Ratio</span>
          <div className="flex items-center gap-2">
            <span className={`font-mono font-bold ${getPCRColor(data.pcr)}`}>{data.pcr.toFixed(2)}</span>
            {getTrendIcon(data.pcrTrend)}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/50">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Call OI</p>
            <p className="font-mono text-sm text-foreground">{formatNumber(data.totalCallOI)}</p>
            <div className={`flex items-center gap-1 mt-1 ${data.callOIChange >= 0 ? 'text-profit' : 'text-loss'}`}>
              {data.callOIChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              <span className="text-xs font-mono">{formatNumber(Math.abs(data.callOIChange))}</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Put OI</p>
            <p className="font-mono text-sm text-foreground">{formatNumber(data.totalPutOI)}</p>
            <div className={`flex items-center gap-1 mt-1 ${data.putOIChange >= 0 ? 'text-profit' : 'text-loss'}`}>
              {data.putOIChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              <span className="text-xs font-mono">{formatNumber(Math.abs(data.putOIChange))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
