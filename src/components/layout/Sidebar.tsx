import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Brain,
  Settings,
  Home,
  Bell,
  Target,
  Wallet,
  TrendingUp,
} from 'lucide-react';

const navigation = [
  { name: 'Home', href: '/home', icon: Home },
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Trades', href: '/trades', icon: BookOpen },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Psychology', href: '/psychology', icon: Brain },
  { name: 'Capital', href: '/capital', icon: Wallet },
  // F&O Live hidden - moved to Home
  { name: 'Alerts', href: '/alerts', icon: Bell },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">AiTrade</h1>
            <p className="text-xs text-muted-foreground">AI-Powered F&O Analysis</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'nav-link',
                  isActive && 'active'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <div className="rounded-lg bg-accent/50 p-3">
            <p className="text-xs text-muted-foreground">
              Market Status
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-profit" />
              <span className="text-sm font-medium text-foreground">NSE Open</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
