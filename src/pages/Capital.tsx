import { Wallet, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, PiggyBank } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const capitalData = [
  { month: 'Jul', capital: 500000, equity: 515000 },
  { month: 'Aug', capital: 500000, equity: 542000 },
  { month: 'Sep', capital: 550000, equity: 589000 },
  { month: 'Oct', capital: 550000, equity: 612000 },
  { month: 'Nov', capital: 600000, equity: 658000 },
  { month: 'Dec', capital: 600000, equity: 698450 },
];

const transactions = [
  { id: 1, type: 'DEPOSIT', amount: 100000, date: '2024-11-15', description: 'Monthly capital addition' },
  { id: 2, type: 'WITHDRAWAL', amount: 50000, date: '2024-11-25', description: 'Partial profit booking' },
  { id: 3, type: 'DEPOSIT', amount: 50000, date: '2024-12-01', description: 'Fresh capital' },
];

export default function Capital() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Capital & Fund Tracking</h1>
        <p className="text-muted-foreground">Monitor your capital flow and ROI</p>
      </div>

      {/* Capital Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wallet className="h-4 w-4" />
            <span className="text-xs font-medium">Total Capital Added</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground font-mono">₹6,00,000</p>
          <p className="text-xs text-muted-foreground mt-1">Lifetime deposits</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-muted-foreground">
            <PiggyBank className="h-4 w-4" />
            <span className="text-xs font-medium">Current Equity</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-profit font-mono">₹6,98,450</p>
          <p className="text-xs text-profit mt-1">+16.4% ROI</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">Realized P&L</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-profit font-mono">₹98,450</p>
          <p className="text-xs text-muted-foreground mt-1">Closed positions</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingDown className="h-4 w-4" />
            <span className="text-xs font-medium">Withdrawn</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground font-mono">₹50,000</p>
          <p className="text-xs text-muted-foreground mt-1">Total withdrawals</p>
        </div>
      </div>

      {/* Capital vs Equity Chart */}
      <div className="stat-card">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Capital vs Equity Growth</h3>
          <p className="text-sm text-muted-foreground">Track your capital added vs performance-based growth</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={capitalData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="capitalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--profit))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--profit))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
              formatter={(value: number, name: string) => [
                `₹${value.toLocaleString('en-IN')}`,
                name === 'capital' ? 'Capital Added' : 'Equity Value'
              ]}
            />
            <Area
              type="monotone"
              dataKey="capital"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              fill="url(#capitalGradient)"
              strokeDasharray="5 5"
            />
            <Area
              type="monotone"
              dataKey="equity"
              stroke="hsl(var(--profit))"
              strokeWidth={2}
              fill="url(#equityGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-6 bg-chart-2 opacity-60" style={{ borderTop: '2px dashed hsl(var(--chart-2))' }} />
            <span className="text-sm text-muted-foreground">Capital Added</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-6 bg-profit" />
            <span className="text-sm text-muted-foreground">Equity Value</span>
          </div>
        </div>
      </div>

      {/* ROI Summary */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="stat-card text-center">
          <p className="text-sm text-muted-foreground">Monthly ROI (Avg)</p>
          <p className="text-3xl font-bold text-profit mt-2">+2.7%</p>
          <p className="text-xs text-muted-foreground mt-1">Last 6 months</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-sm text-muted-foreground">Annualized ROI</p>
          <p className="text-3xl font-bold text-profit mt-2">+32.8%</p>
          <p className="text-xs text-muted-foreground mt-1">Projected</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-sm text-muted-foreground">Capital Efficiency</p>
          <p className="text-3xl font-bold text-foreground mt-2">68%</p>
          <p className="text-xs text-muted-foreground mt-1">Avg margin utilization</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="stat-card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Transaction History</h3>
          <button className="text-sm font-medium text-primary hover:underline">Add Transaction</button>
        </div>
        <div className="space-y-3">
          {transactions.map((txn) => (
            <div
              key={txn.id}
              className="flex items-center justify-between rounded-lg bg-muted/30 p-3"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  txn.type === 'DEPOSIT' ? 'bg-profit/10' : 'bg-loss/10'
                }`}>
                  {txn.type === 'DEPOSIT' ? (
                    <ArrowUpCircle className="h-5 w-5 text-profit" />
                  ) : (
                    <ArrowDownCircle className="h-5 w-5 text-loss" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">{txn.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(txn.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <p className={`font-mono font-semibold ${
                txn.type === 'DEPOSIT' ? 'text-profit' : 'text-loss'
              }`}>
                {txn.type === 'DEPOSIT' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
