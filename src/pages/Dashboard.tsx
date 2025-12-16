import { TrendingUp, Target, Activity, Award } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { EquityCurve } from '@/components/dashboard/EquityCurve';
import { RecentTrades } from '@/components/dashboard/RecentTrades';
import { ExpiryCalendar } from '@/components/dashboard/ExpiryCalendar';
import { AISummary } from '@/components/dashboard/AISummary';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { AIAnalysisCard } from '@/components/dashboard/AIAnalysisCard';
import { mockPortfolioStats } from '@/data/mockData';

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your trading performance overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total P&L"
          value={mockPortfolioStats.totalPnl}
          change={12.5}
          icon={TrendingUp}
          format="currency"
        />
        <StatCard
          title="Win Rate"
          value={mockPortfolioStats.winRate}
          change={3.2}
          icon={Target}
          format="percent"
        />
        <StatCard
          title="Total Trades"
          value={mockPortfolioStats.totalTrades}
          icon={Activity}
        />
        <StatCard
          title="Profit Factor"
          value={mockPortfolioStats.profitFactor.toFixed(2)}
          change={8.1}
          icon={Award}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <EquityCurve />
        <PerformanceChart />
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <AIAnalysisCard />
        <ExpiryCalendar />
      </div>

      {/* Additional Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentTrades />
        <AISummary />
      </div>
    </div>
  );
}
