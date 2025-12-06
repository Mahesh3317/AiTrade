import { useState, useEffect } from 'react';
import { RefreshCw, Radio, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MarketOverview } from '@/components/live/MarketOverview';
import { IVRankCard } from '@/components/live/IVRankCard';
import { OIAnalysisCard } from '@/components/live/OIAnalysisCard';
import { OptionChainTable } from '@/components/live/OptionChainTable';
import { OIChart } from '@/components/live/OIChart';
import { 
  mockMarketData, 
  mockIVData, 
  mockOIAnalysis, 
  mockOptionChain,
  expiryDates,
  symbols
} from '@/data/optionChainData';

export default function Live() {
  const [selectedSymbol, setSelectedSymbol] = useState('NIFTY');
  const [selectedExpiry, setSelectedExpiry] = useState(expiryDates[0].value);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Simulate live updates
  useEffect(() => {
    if (!isLive) return;
    
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isLive]);

  const selectedExpiryData = expiryDates.find(e => e.value === selectedExpiry);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">F&O Live</h1>
          <p className="text-muted-foreground text-sm">Real-time Option Chain & Analytics</p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Radio className={`h-4 w-4 ${isLive ? 'text-profit animate-pulse' : 'text-muted-foreground'}`} />
            <span className="text-xs text-muted-foreground">
              {isLive ? 'Live' : 'Paused'} • Updated {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
          
          <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {symbols.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedExpiry} onValueChange={setSelectedExpiry}>
            <SelectTrigger className="w-[160px] h-9">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {expiryDates.map(e => (
                <SelectItem key={e.value} value={e.value}>
                  {e.label}
                  <Badge variant="outline" className="ml-2 text-[10px]">{e.daysToExpiry}D</Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsLive(!isLive)}
            className={isLive ? 'border-profit text-profit' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLive ? 'animate-spin' : ''}`} />
            {isLive ? 'Pause' : 'Resume'}
          </Button>
        </div>
      </div>

      {/* Market Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MarketOverview data={mockMarketData} />
        <IVRankCard data={mockIVData} />
        <OIAnalysisCard data={mockOIAnalysis} />
      </div>

      {/* Option Chain & OI Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <OptionChainTable data={mockOptionChain} spotPrice={mockMarketData.spotPrice} />
        </div>
        <div>
          <OIChart data={mockOptionChain} spotPrice={mockMarketData.spotPrice} />
        </div>
      </div>

      {/* Greeks Legend */}
      <div className="stat-card">
        <h3 className="font-semibold text-foreground mb-3">Greeks Reference</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-mono font-bold text-profit">Δ Delta</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Rate of change in option price per ₹1 change in underlying. Range: 0 to 1 (calls), -1 to 0 (puts).
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-mono font-bold text-chart-2">Γ Gamma</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Rate of change in Delta. Highest at ATM strikes. Important for hedging adjustments.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-mono font-bold text-loss">Θ Theta</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Time decay per day. Always negative for long options. Accelerates near expiry.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-mono font-bold text-chart-4">V Vega</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Sensitivity to 1% change in IV. Higher for ATM options and longer-dated expiries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
