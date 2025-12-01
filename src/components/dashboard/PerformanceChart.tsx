import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { mockDailyStats } from '@/data/mockData';

export function PerformanceChart() {
  const data = mockDailyStats.map((stat) => ({
    date: new Date(stat.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    pnl: stat.pnl,
    trades: stat.trades,
    winRate: stat.winRate,
  }));

  return (
    <div className="stat-card h-[320px]">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Daily P&L</h3>
        <p className="text-sm text-muted-foreground">Profit/Loss by day</p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
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
            formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'P&L']}
          />
          <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.pnl >= 0 ? 'hsl(var(--profit))' : 'hsl(var(--loss))'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
