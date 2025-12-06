import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { MarketData } from '@/data/optionChainData';

interface MarketOverviewProps {
  data: MarketData;
}

export function MarketOverview({ data }: MarketOverviewProps) {
  const isPositive = data.change >= 0;
  
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isPositive ? 'bg-profit/10' : 'bg-loss/10'}`}>
            <Activity className={`h-5 w-5 ${isPositive ? 'text-profit' : 'text-loss'}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{data.symbol}</h3>
            <p className="text-xs text-muted-foreground">Spot Price</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono font-bold text-foreground">
            {data.spotPrice.toLocaleString('en-IN')}
          </p>
          <div className={`flex items-center gap-1 justify-end ${isPositive ? 'text-profit' : 'text-loss'}`}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="font-mono text-sm">
              {isPositive ? '+' : ''}{data.change.toFixed(2)} ({isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-4 pt-3 border-t border-border/50">
        <div>
          <p className="text-xs text-muted-foreground">Open</p>
          <p className="font-mono text-sm text-foreground">{data.open.toLocaleString('en-IN')}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">High</p>
          <p className="font-mono text-sm text-profit">{data.high.toLocaleString('en-IN')}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Low</p>
          <p className="font-mono text-sm text-loss">{data.low.toLocaleString('en-IN')}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Prev Close</p>
          <p className="font-mono text-sm text-foreground">{data.prevClose.toLocaleString('en-IN')}</p>
        </div>
      </div>
    </div>
  );
}
