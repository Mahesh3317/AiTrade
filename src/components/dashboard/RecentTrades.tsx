import { cn } from '@/lib/utils';
import { mockTrades } from '@/data/mockData';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function RecentTrades() {
  const recentTrades = mockTrades.slice(0, 5);

  return (
    <div className="stat-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Recent Trades</h3>
          <p className="text-sm text-muted-foreground">Your latest positions</p>
        </div>
        <button className="text-sm font-medium text-primary hover:underline">
          View All
        </button>
      </div>
      <div className="space-y-3">
        {recentTrades.map((trade) => (
          <div
            key={trade.id}
            className="flex items-center justify-between rounded-lg bg-muted/30 p-3 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                trade.pnl >= 0 ? 'bg-profit/10' : 'bg-loss/10'
              )}>
                {trade.pnl >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-profit" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-loss" />
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">{trade.underlying}</p>
                <p className="text-xs text-muted-foreground">
                  {trade.instrumentType} • {trade.strategy}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn(
                "font-mono font-semibold",
                trade.pnl >= 0 ? 'text-profit' : 'text-loss'
              )}>
                {trade.pnl >= 0 ? '+' : ''}₹{trade.pnl.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(trade.entryTime).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
