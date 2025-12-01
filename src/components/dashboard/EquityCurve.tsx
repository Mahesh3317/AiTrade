import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { mockDailyStats } from '@/data/mockData';

export function EquityCurve() {
  // Calculate cumulative P&L
  let cumulative = 0;
  const data = mockDailyStats.map((stat) => {
    cumulative += stat.pnl;
    return {
      date: new Date(stat.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      pnl: cumulative,
      dailyPnl: stat.pnl,
    };
  });

  return (
    <div className="stat-card h-[320px]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Equity Curve</h3>
          <p className="text-sm text-muted-foreground">Cumulative P&L over time</p>
        </div>
        <div className="flex gap-2">
          {['1W', '1M', '3M', 'ALL'].map((period) => (
            <button
              key={period}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                period === '1M' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--profit))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--profit))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
            dx={-10}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-card)',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Total P&L']}
          />
          <Area
            type="monotone"
            dataKey="pnl"
            stroke="hsl(var(--profit))"
            strokeWidth={2}
            fill="url(#pnlGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
