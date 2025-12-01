import { User, Shield, Bell, Database, Sliders, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function Settings() {
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <div className="stat-card">
        <div className="flex items-center gap-3 mb-6">
          <User className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Profile</h3>
        </div>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input defaultValue="Trader Pro" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input defaultValue="trader@example.com" type="email" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input defaultValue="+91 98765 43210" type="tel" />
          </div>
          <Button size="sm">Save Changes</Button>
        </div>
      </div>

      {/* Risk Rules Section */}
      <div className="stat-card">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Risk Rules</h3>
        </div>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Max Daily Loss</p>
              <p className="text-sm text-muted-foreground">Stop trading after reaching this limit</p>
            </div>
            <Input className="w-32" defaultValue="₹10,000" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Max Position Size</p>
              <p className="text-sm text-muted-foreground">Maximum capital per trade</p>
            </div>
            <Input className="w-32" defaultValue="₹50,000" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Max Open Positions</p>
              <p className="text-sm text-muted-foreground">Limit concurrent trades</p>
            </div>
            <Input className="w-32" defaultValue="5" type="number" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Cool-off After Losses</p>
              <p className="text-sm text-muted-foreground">Pause after consecutive losses</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="stat-card">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Price Alerts</p>
              <p className="text-sm text-muted-foreground">Get notified on price targets</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Risk Alerts</p>
              <p className="text-sm text-muted-foreground">Alerts when approaching limits</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Daily Summary</p>
              <p className="text-sm text-muted-foreground">End of day performance email</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Expiry Reminders</p>
              <p className="text-sm text-muted-foreground">Notify before F&O expiry</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>

      {/* Trading Preferences */}
      <div className="stat-card">
        <div className="flex items-center gap-3 mb-6">
          <Sliders className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Trading Preferences</h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Default Lot Size (Index Options)</Label>
            <Input defaultValue="50" type="number" />
          </div>
          <div className="space-y-2">
            <Label>Default Stop Loss %</Label>
            <Input defaultValue="25" type="number" />
          </div>
          <div className="space-y-2">
            <Label>Default Target %</Label>
            <Input defaultValue="50" type="number" />
          </div>
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="stat-card">
        <div className="flex items-center gap-3 mb-6">
          <Database className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Data & Privacy</h3>
        </div>
        <div className="space-y-4">
          <Button variant="outline" size="sm">Export All Data</Button>
          <Button variant="outline" size="sm" className="text-loss border-loss/30 hover:bg-loss/10">
            Delete Account
          </Button>
        </div>
      </div>

      {/* Logout */}
      <Button variant="outline" className="w-full">
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}
