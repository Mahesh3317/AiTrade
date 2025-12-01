import { Calendar, Clock } from 'lucide-react';
import { upcomingExpiries } from '@/data/mockData';
import { cn } from '@/lib/utils';

export function ExpiryCalendar() {
  return (
    <div className="stat-card">
      <div className="mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Upcoming Expiries</h3>
      </div>
      <div className="space-y-3">
        {upcomingExpiries.map((expiry, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded-lg bg-muted/30 p-3"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 flex-col items-center justify-center rounded-lg",
                expiry.daysLeft <= 3 ? 'bg-warning/10' : 'bg-accent'
              )}>
                <span className={cn(
                  "text-xs font-medium",
                  expiry.daysLeft <= 3 ? 'text-warning' : 'text-muted-foreground'
                )}>
                  {new Date(expiry.date).toLocaleDateString('en-IN', { month: 'short' })}
                </span>
                <span className={cn(
                  "text-lg font-bold leading-none",
                  expiry.daysLeft <= 3 ? 'text-warning' : 'text-foreground'
                )}>
                  {new Date(expiry.date).getDate()}
                </span>
              </div>
              <div>
                <p className="font-medium text-foreground">{expiry.instrument}</p>
                <p className="text-xs text-muted-foreground">{expiry.type} Expiry</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className={cn(
                "h-3.5 w-3.5",
                expiry.daysLeft <= 3 ? 'text-warning' : 'text-muted-foreground'
              )} />
              <span className={cn(
                "text-sm font-medium",
                expiry.daysLeft <= 3 ? 'text-warning' : 'text-muted-foreground'
              )}>
                {expiry.daysLeft}d left
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
