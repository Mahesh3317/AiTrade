import { Gauge, TrendingUp, TrendingDown } from 'lucide-react';
import { IVData } from '@/data/optionChainData';
import { Progress } from '@/components/ui/progress';

interface IVRankCardProps {
  data: IVData;
}

export function IVRankCard({ data }: IVRankCardProps) {
  const getIVColor = (rank: number) => {
    if (rank < 30) return 'text-profit';
    if (rank > 70) return 'text-loss';
    return 'text-warning';
  };
  
  const getIVLabel = (rank: number) => {
    if (rank < 30) return 'Low IV';
    if (rank > 70) return 'High IV';
    return 'Normal IV';
  };
  
  return (
    <div className="stat-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-chart-4/10">
          <Gauge className="h-5 w-5 text-chart-4" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">IV Analysis</h3>
          <p className="text-xs text-muted-foreground">Implied Volatility Metrics</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Current IV</span>
          <span className="font-mono font-semibold text-foreground">{data.current}%</span>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">IV Rank</span>
            <span className={`font-mono font-bold ${getIVColor(data.rank)}`}>
              {data.rank}% <span className="text-xs font-normal">({getIVLabel(data.rank)})</span>
            </span>
          </div>
          <Progress value={data.rank} className="h-2" />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">IV Percentile</span>
            <span className="font-mono text-foreground">{data.percentile}%</span>
          </div>
          <Progress value={data.percentile} className="h-2" />
        </div>
        
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/50">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">52W High</p>
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3 text-loss" />
              <span className="font-mono text-sm text-loss">{data.high52w}%</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Mean</p>
            <span className="font-mono text-sm text-foreground">{data.mean}%</span>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">52W Low</p>
            <div className="flex items-center justify-center gap-1">
              <TrendingDown className="h-3 w-3 text-profit" />
              <span className="font-mono text-sm text-profit">{data.low52w}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
