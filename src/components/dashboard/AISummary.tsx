import { Sparkles, TrendingUp, AlertTriangle, Target } from 'lucide-react';

export function AISummary() {
  return (
    <div className="stat-card">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-chart-2/20">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">AI Insights</h3>
          <p className="text-xs text-muted-foreground">Weekly Performance Summary</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg bg-profit/5 p-3 border border-profit/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-profit" />
            <span className="text-sm font-medium text-profit">Strength</span>
          </div>
          <p className="text-sm text-foreground">
            Your NIFTY options momentum trades show a <span className="font-semibold text-profit">73% win rate</span> this week. 
            Best performance during 10:30-11:30 AM session.
          </p>
        </div>

        <div className="rounded-lg bg-warning/5 p-3 border border-warning/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium text-warning">Area to Improve</span>
          </div>
          <p className="text-sm text-foreground">
            Reversal setups showing <span className="font-semibold text-warning">40% win rate</span>. 
            Consider waiting for confirmation before entry.
          </p>
        </div>

        <div className="rounded-lg bg-chart-2/5 p-3 border border-chart-2/20">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-chart-2" />
            <span className="text-sm font-medium text-chart-2">This Week's Focus</span>
          </div>
          <p className="text-sm text-foreground">
            Focus on momentum setups in BANKNIFTY. Your avg R-multiple is 
            <span className="font-semibold text-chart-2"> 2.1x</span> for this strategy.
          </p>
        </div>
      </div>
    </div>
  );
}
