import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  format?: 'currency' | 'percent' | 'number';
}

export function StatCard({ title, value, change, icon: Icon, format = 'number' }: StatCardProps) {
  const formatValue = () => {
    if (format === 'currency') {
      return `₹${Number(value).toLocaleString('en-IN')}`;
    }
    if (format === 'percent') {
      return `${value}%`;
    }
    return value;
  };

  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn(
            "mt-2 text-2xl font-bold font-mono tracking-tight",
            format === 'currency' && (Number(value) >= 0 ? 'text-profit' : 'text-loss')
          )}>
            {formatValue()}
          </p>
          {change !== undefined && (
            <p className={cn(
              "mt-1 text-sm font-medium",
              isPositive ? 'text-profit' : 'text-loss'
            )}>
              {isPositive ? '+' : ''}{change}% from last week
            </p>
          )}
        </div>
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          format === 'currency' && Number(value) >= 0 ? 'bg-profit/10' : format === 'currency' ? 'bg-loss/10' : 'bg-primary/10'
        )}>
          <Icon className={cn(
            "h-5 w-5",
            format === 'currency' && Number(value) >= 0 ? 'text-profit' : format === 'currency' ? 'text-loss' : 'text-primary'
          )} />
        </div>
      </div>
    </div>
  );
}
