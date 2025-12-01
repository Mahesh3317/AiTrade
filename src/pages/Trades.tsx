import { useState } from 'react';
import { Plus, Filter, Download, ArrowUpRight, ArrowDownRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { mockTrades } from '@/data/mockData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { strategies, setups } from '@/data/mockData';

export default function Trades() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);

  const filteredTrades = mockTrades.filter(
    (trade) =>
      trade.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.underlying.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.strategy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trade Journal</h1>
          <p className="text-muted-foreground">Log and manage your trades</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Dialog open={isAddTradeOpen} onOpenChange={setIsAddTradeOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Trade
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Log New Trade</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Symbol</Label>
                    <Input placeholder="e.g., NIFTY, BANKNIFTY" />
                  </div>
                  <div className="space-y-2">
                    <Label>Instrument Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPT">Options</SelectItem>
                        <SelectItem value="FUT">Futures</SelectItem>
                        <SelectItem value="EQ">Equity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Strike</Label>
                    <Input type="number" placeholder="Strike price" />
                  </div>
                  <div className="space-y-2">
                    <Label>Option Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="CE/PE" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CE">Call (CE)</SelectItem>
                        <SelectItem value="PE">Put (PE)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Side</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Buy/Sell" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BUY">Buy</SelectItem>
                        <SelectItem value="SELL">Sell</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity (Lots)</Label>
                    <Input type="number" placeholder="Lots" />
                  </div>
                  <div className="space-y-2">
                    <Label>Entry Price</Label>
                    <Input type="number" placeholder="Avg price" />
                  </div>
                  <div className="space-y-2">
                    <Label>Exit Price</Label>
                    <Input type="number" placeholder="Exit price" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Strategy</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select strategy" />
                      </SelectTrigger>
                      <SelectContent>
                        {strategies.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Setup</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select setup" />
                      </SelectTrigger>
                      <SelectContent>
                        {setups.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input placeholder="Trade notes and observations..." />
                </div>
                <Button className="w-full mt-2">Save Trade</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search trades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Trades Table */}
      <div className="stat-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Symbol</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Side</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Entry</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Exit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">P&L</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Strategy</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTrades.map((trade) => (
                <tr key={trade.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        trade.pnl >= 0 ? 'bg-profit/10' : 'bg-loss/10'
                      )}>
                        {trade.pnl >= 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-profit" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-loss" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{trade.underlying}</p>
                        <p className="text-xs text-muted-foreground">
                          {trade.strike ? `${trade.strike} ${trade.optionType}` : 'FUT'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium">
                      {trade.instrumentType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                      trade.side === 'BUY' ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'
                    )}>
                      {trade.side}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">₹{trade.avgPrice.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 font-mono text-sm">
                    {trade.exitPrice ? `₹${trade.exitPrice.toLocaleString('en-IN')}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">{trade.quantity}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "font-mono font-semibold",
                      trade.pnl >= 0 ? 'text-profit' : 'text-loss'
                    )}>
                      {trade.pnl >= 0 ? '+' : ''}₹{trade.pnl.toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{trade.strategy}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(trade.entryTime).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
