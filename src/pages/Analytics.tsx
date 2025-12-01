import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Target, Clock, Percent, Award } from 'lucide-react';
import { mockPortfolioStats, mockDailyStats } from '@/data/mockData';
import { cn } from '@/lib/utils';

const winLossData = [
  { name: 'Winners', value: 43, color: 'hsl(var(--profit))' },
  { name: 'Losers', value: 27, color: 'hsl(var(--loss))' },
];

const strategyData = [
  { name: 'Momentum', wins: 18, losses: 6 },
  { name: 'Reversal', wins: 8, losses: 10 },
  { name: 'Swing', wins: 12, losses: 5 },
  { name: 'Scalping', wins: 5, losses: 6 },
];

const hourlyData = [
  { hour: '9:15', pnl: 2500 },
  { hour: '10:00', pnl: 4200 },
  { hour: '10:30', pnl: 8500 },
  { hour: '11:00', pnl: 6200 },
  { hour: '11:30', pnl: 3800 },
  { hour: '12:00', pnl: 1200 },
  { hour: '12:30', pnl: -800 },
  { hour: '13:00', pnl: 2100 },
  { hour: '13:30', pnl: 4500 },
  { hour: '14:00', pnl: 5200 },
  { hour: '14:30', pnl: 3100 },
  { hour: '15:00', pnl: 1800 },
];

export default function Analytics() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Deep dive into your trading performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="stat-card">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Percent className="h-4 w-4" />
            <span className="text-xs font-medium">Win Rate</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-profit">{mockPortfolioStats.winRate}%</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">Avg Win</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-profit font-mono">₹{mockPortfolioStats.avgWin.toLocaleString('en-IN')}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingDown className="h-4 w-4" />
            <span className="text-xs font-medium">Avg Loss</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-loss font-mono">₹{Math.abs(mockPortfolioStats.avgLoss).toLocaleString('en-IN')}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Award className="h-4 w-4" />
            <span className="text-xs font-medium">Profit Factor</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{mockPortfolioStats.profitFactor.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target className="h-4 w-4" />
            <span className="text-xs font-medium">Expectancy</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-profit font-mono">₹{mockPortfolioStats.expectancy.toFixed(0)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Max DD</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-loss font-mono">₹{Math.abs(mockPortfolioStats.maxDrawdown).toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Win/Loss Distribution */}
        <div className="stat-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Win/Loss Distribution</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={winLossData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {winLossData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {winLossData.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-2xl font-bold font-mono" style={{ color: item.color }}>
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Strategy Performance */}
        <div className="stat-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Strategy Performance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={strategyData} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
              />
              <Legend />
              <Bar dataKey="wins" name="Wins" fill="hsl(var(--profit))" radius={[0, 4, 4, 0]} />
              <Bar dataKey="losses" name="Losses" fill="hsl(var(--loss))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly Performance */}
      <div className="stat-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">Performance by Hour</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="hour"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
              formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'P&L']}
            />
            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
              {hourlyData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.pnl >= 0 ? 'hsl(var(--profit))' : 'hsl(var(--loss))'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Best/Worst Days */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="stat-card border-l-4 border-l-profit">
          <h3 className="text-sm font-medium text-muted-foreground">Best Trading Day</h3>
          {mockPortfolioStats.bestDay && (
            <div className="mt-2">
              <p className="text-2xl font-bold text-profit font-mono">
                +₹{mockPortfolioStats.bestDay.pnl.toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(mockPortfolioStats.bestDay.date).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
              <p className="text-sm text-muted-foreground">
                {mockPortfolioStats.bestDay.trades} trades • {mockPortfolioStats.bestDay.winRate}% win rate
              </p>
            </div>
          )}
        </div>
        <div className="stat-card border-l-4 border-l-loss">
          <h3 className="text-sm font-medium text-muted-foreground">Worst Trading Day</h3>
          {mockPortfolioStats.worstDay && (
            <div className="mt-2">
              <p className="text-2xl font-bold text-loss font-mono">
                ₹{mockPortfolioStats.worstDay.pnl.toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(mockPortfolioStats.worstDay.date).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
              <p className="text-sm text-muted-foreground">
                {mockPortfolioStats.worstDay.trades} trades • {mockPortfolioStats.worstDay.winRate}% win rate
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
