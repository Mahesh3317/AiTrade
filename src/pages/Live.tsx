import { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Radio, Calendar, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MarketOverview } from '@/components/live/MarketOverview';
import { IVRankCard } from '@/components/live/IVRankCard';
import { OIAnalysisCard } from '@/components/live/OIAnalysisCard';
import { OptionChainTable } from '@/components/live/OptionChainTable';
import { OIChart } from '@/components/live/OIChart';
import { useMstockData } from '@/hooks/useMstockData';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  mockMarketData, 
  mockIVData, 
  mockOIAnalysis, 
  mockOptionChain,
} from '@/data/optionChainData';

interface ParsedSymbol {
  name: string;
  token: number;
  expiryKeys: number[];
}

interface ParsedExpiry {
  key: number;
  timestamp: number;
  date: Date;
  label: string;
  daysToExpiry: number;
}

export default function Live() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [selectedExpiry, setSelectedExpiry] = useState<string>('');
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  
  const { 
    loading, 
    error, 
    optionChainMaster, 
    optionChainData,
    fetchOptionChainMaster, 
    fetchOptionChain,
    fetchQuote 
  } = useMstockData();

  // Parse symbols from master data
  const parsedSymbols = useMemo((): ParsedSymbol[] => {
    if (!optionChainMaster?.OPTIDX) return [];
    
    return optionChainMaster.OPTIDX.map((item: string) => {
      const parts = item.split(',');
      const name = parts[0];
      const token = parseInt(parts[1], 10);
      const expiryKeys = parts.slice(2).map((k: string) => parseInt(k, 10));
      return { name, token, expiryKeys };
    });
  }, [optionChainMaster]);

  // Parse expiry dates from master data
  const parsedExpiries = useMemo((): ParsedExpiry[] => {
    if (!optionChainMaster?.dctExp) return [];
    
    const now = new Date();
    return Object.entries(optionChainMaster.dctExp)
      .map(([key, timestamp]) => {
        const ts = timestamp as number;
        const date = new Date(ts * 1000);
        const daysToExpiry = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          key: parseInt(key, 10),
          timestamp: ts,
          date,
          label: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          daysToExpiry
        };
      })
      .filter(exp => exp.daysToExpiry > 0)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [optionChainMaster]);

  // Get available expiries for selected symbol
  const availableExpiries = useMemo(() => {
    const symbol = parsedSymbols.find(s => s.name === selectedSymbol);
    if (!symbol) return [];
    
    return parsedExpiries.filter(exp => symbol.expiryKeys.includes(exp.key));
  }, [selectedSymbol, parsedSymbols, parsedExpiries]);

  // Test API connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        await fetchOptionChainMaster(2);
        setApiConnected(true);
      } catch {
        setApiConnected(false);
      }
    };
    testConnection();
  }, [fetchOptionChainMaster]);

  // Set default symbol when master data loads
  useEffect(() => {
    if (parsedSymbols.length > 0 && !selectedSymbol) {
      const nifty = parsedSymbols.find(s => s.name === 'NIFTY');
      setSelectedSymbol(nifty?.name || parsedSymbols[0].name);
    }
  }, [parsedSymbols, selectedSymbol]);

  // Set default expiry when symbol changes
  useEffect(() => {
    if (availableExpiries.length > 0 && !availableExpiries.find(e => e.key.toString() === selectedExpiry)) {
      setSelectedExpiry(availableExpiries[0].key.toString());
    }
  }, [availableExpiries, selectedExpiry]);

  // Fetch option chain when symbol/expiry changes
  useEffect(() => {
    const symbol = parsedSymbols.find(s => s.name === selectedSymbol);
    const expiry = parsedExpiries.find(e => e.key.toString() === selectedExpiry);
    
    if (symbol && expiry) {
      console.log(`Fetching option chain for ${symbol.name} (token: ${symbol.token}) expiry: ${expiry.label}`);
      fetchOptionChain(expiry.timestamp, symbol.token, 2);
    }
  }, [selectedSymbol, selectedExpiry, parsedSymbols, parsedExpiries, fetchOptionChain]);

  // Update connection status based on response
  useEffect(() => {
    if (optionChainMaster) {
      setApiConnected(true);
    } else if (error) {
      setApiConnected(false);
    }
  }, [optionChainMaster, error]);

  // Simulate live updates
  useEffect(() => {
    if (!isLive) return;
    
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      
      // Refresh option chain data
      const symbol = parsedSymbols.find(s => s.name === selectedSymbol);
      const expiry = parsedExpiries.find(e => e.key.toString() === selectedExpiry);
      
      if (symbol && expiry) {
        fetchOptionChain(expiry.timestamp, symbol.token, 2);
      }
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, [isLive, selectedSymbol, selectedExpiry, parsedSymbols, parsedExpiries, fetchOptionChain]);

  // Transform mStock option chain data to component format
  const transformedOptionChain = useMemo(() => {
    if (!optionChainData?.opDta) return mockOptionChain;
    
    try {
      return optionChainData.opDta.map((item: any) => ({
        strike: parseFloat(item.stkPrc) || 0,
        callLTP: parseFloat(item.ceQt?.ltp) || 0,
        callOI: parseInt(item.ceQt?.opnInt) || 0,
        callOIChange: parseInt(item.ceQt?.opIntChg) || 0,
        callVolume: parseInt(item.ceQt?.vol) || 0,
        callIV: parseFloat(item.ceQt?.iv) || 0,
        callDelta: parseFloat(item.ceQt?.delta) || 0,
        callGamma: parseFloat(item.ceQt?.gamma) || 0,
        callTheta: parseFloat(item.ceQt?.theta) || 0,
        callVega: parseFloat(item.ceQt?.vega) || 0,
        putLTP: parseFloat(item.peQt?.ltp) || 0,
        putOI: parseInt(item.peQt?.opnInt) || 0,
        putOIChange: parseInt(item.peQt?.opIntChg) || 0,
        putVolume: parseInt(item.peQt?.vol) || 0,
        putIV: parseFloat(item.peQt?.iv) || 0,
        putDelta: parseFloat(item.peQt?.delta) || 0,
        putGamma: parseFloat(item.peQt?.gamma) || 0,
        putTheta: parseFloat(item.peQt?.theta) || 0,
        putVega: parseFloat(item.peQt?.vega) || 0,
      })).sort((a: any, b: any) => a.strike - b.strike);
    } catch (err) {
      console.error('Error transforming option chain:', err);
      return mockOptionChain;
    }
  }, [optionChainData]);

  // Get spot price from option chain data
  const spotPrice = useMemo(() => {
    if (optionChainData?.sptPrc) {
      return parseFloat(optionChainData.sptPrc);
    }
    return mockMarketData.spotPrice;
  }, [optionChainData]);

  // Calculate market data from option chain
  const marketData = useMemo((): typeof mockMarketData => {
    if (!optionChainData) return mockMarketData;
    
    return {
      symbol: selectedSymbol || mockMarketData.symbol,
      spotPrice: spotPrice,
      change: parseFloat(optionChainData.chng) || mockMarketData.change,
      changePercent: parseFloat(optionChainData.chngPer) || mockMarketData.changePercent,
      high: parseFloat(optionChainData.high) || mockMarketData.high,
      low: parseFloat(optionChainData.low) || mockMarketData.low,
      open: parseFloat(optionChainData.open) || mockMarketData.open,
      prevClose: parseFloat(optionChainData.prvCls) || mockMarketData.prevClose,
    };
  }, [optionChainData, spotPrice, selectedSymbol]);

  const selectedExpiryData = availableExpiries.find(e => e.key.toString() === selectedExpiry);
  const isUsingRealData = apiConnected && optionChainData?.opDta;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* API Connection Status */}
      {error && (
        <Alert variant="destructive" className="border-loss/50 bg-loss/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center gap-2">
            <span>mStock API: {error}</span>
            <span className="text-xs text-muted-foreground">(Using mock data)</span>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">F&O Live</h1>
          <p className="text-muted-foreground text-sm">
            Real-time Option Chain & Analytics
            {isUsingRealData && <Badge variant="outline" className="ml-2 text-profit border-profit">Live Data</Badge>}
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {/* API Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border">
            {loading ? (
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
            ) : apiConnected === true ? (
              <Wifi className="h-3.5 w-3.5 text-profit" />
            ) : apiConnected === false ? (
              <WifiOff className="h-3.5 w-3.5 text-loss" />
            ) : (
              <Radio className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="text-xs font-medium">
              {loading ? 'Connecting...' : apiConnected ? 'mStock Connected' : 'Mock Data'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Radio className={`h-4 w-4 ${isLive ? 'text-profit animate-pulse' : 'text-muted-foreground'}`} />
            <span className="text-xs text-muted-foreground">
              {isLive ? 'Live' : 'Paused'} • Updated {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
          
          <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Select Symbol" />
            </SelectTrigger>
            <SelectContent>
              {parsedSymbols.map(s => (
                <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedExpiry} onValueChange={setSelectedExpiry}>
            <SelectTrigger className="w-[180px] h-9">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select Expiry" />
            </SelectTrigger>
            <SelectContent>
              {availableExpiries.map(e => (
                <SelectItem key={e.key} value={e.key.toString()}>
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
        <MarketOverview data={marketData} />
        <IVRankCard data={mockIVData} />
        <OIAnalysisCard data={mockOIAnalysis} />
      </div>

      {/* Option Chain & OI Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <OptionChainTable data={transformedOptionChain} spotPrice={spotPrice} />
        </div>
        <div>
          <OIChart data={transformedOptionChain} spotPrice={spotPrice} />
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
