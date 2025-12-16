import { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCw, Radio, Calendar, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MarketOverview } from '@/components/live/MarketOverview';
import { IVRankCard } from '@/components/live/IVRankCard';
import { OIAnalysisCard } from '@/components/live/OIAnalysisCard';
import { OptionChainTable } from '@/components/live/OptionChainTable';
import { OIChart } from '@/components/live/OIChart';
import { DiagnosticsPanel } from '@/components/live/DiagnosticsPanel';
import { useNseData } from '@/hooks/useNseData';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SYMBOLS = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];

export default function Live() {
  const [selectedSymbol, setSelectedSymbol] = useState('NIFTY');
  const [selectedExpiry, setSelectedExpiry] = useState<string>('');
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  const { loading, error, data, diagnostics, fetchOptionChain } = useNseData();

  // Fetch data on mount and when symbol/expiry changes
  const loadData = useCallback(async () => {
    console.log('📊 Loading NSE data for', selectedSymbol, selectedExpiry || '(default expiry)');
    const result = await fetchOptionChain(selectedSymbol, selectedExpiry || undefined);
    if (result) {
      setLastUpdate(new Date());
      // Set first expiry as default if not set
      if (!selectedExpiry && result.expiryDates?.length > 0) {
        setSelectedExpiry(result.expiryDates[0]);
      }
    }
  }, [selectedSymbol, selectedExpiry, fetchOptionChain]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [selectedSymbol]); // Only reload on symbol change initially

  // Load when expiry changes (after initial load)
  useEffect(() => {
    if (selectedExpiry) {
      loadData();
    }
  }, [selectedExpiry]);

  // Auto-refresh every 10 seconds when live
  useEffect(() => {
    if (!isLive) return;
    
    const interval = setInterval(() => {
      console.log('⏰ Auto-refresh');
      loadData();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [isLive, loadData]);

  // Transform NSE data to component format
  const transformedOptionChain = useMemo(() => {
    if (!data?.data || data.data.length === 0) return [];

    console.log(`✅ Transforming ${data.data.length} strikes from NSE`);

    return data.data
      .map((item) => ({
        strike: item.strikePrice,
        callLTP: item.CE?.lastPrice || 0,
        callOI: item.CE?.openInterest || 0,
        callOIChange: item.CE?.changeinOpenInterest || 0,
        callVolume: item.CE?.totalTradedVolume || 0,
        callIV: item.CE?.impliedVolatility || 0,
        callDelta: 0, // NSE doesn't provide Greeks
        callGamma: 0,
        callTheta: 0,
        callVega: 0,
        putLTP: item.PE?.lastPrice || 0,
        putOI: item.PE?.openInterest || 0,
        putOIChange: item.PE?.changeinOpenInterest || 0,
        putVolume: item.PE?.totalTradedVolume || 0,
        putIV: item.PE?.impliedVolatility || 0,
        putDelta: 0,
        putGamma: 0,
        putTheta: 0,
        putVega: 0,
      }))
      .sort((a, b) => a.strike - b.strike);
  }, [data]);

  // Spot price
  const spotPrice = useMemo(() => {
    return data?.spotPrice || data?.indexQuote?.last || 0;
  }, [data]);

  // Market data
  const marketData = useMemo(() => {
    if (!data) {
      return {
        symbol: selectedSymbol,
        spotPrice,
        change: 0,
        changePercent: 0,
        high: spotPrice,
        low: spotPrice,
        open: spotPrice,
        prevClose: spotPrice,
      };
    }

    const quote = data.indexQuote;
    return {
      symbol: data.symbol || selectedSymbol,
      spotPrice,
      change: quote?.change || 0,
      changePercent: quote?.percentChange || 0,
      high: quote?.high || spotPrice,
      low: quote?.low || spotPrice,
      open: quote?.open || spotPrice,
      prevClose: quote?.previousClose || spotPrice,
    };
  }, [data, spotPrice, selectedSymbol]);

  // IV data from option chain
  const ivData = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return { current: 0, rank: 0, percentile: 0, high52w: 0, low52w: 0, mean: 0 };
    }

    const allIVs = data.data
      .flatMap((item) => [item.CE?.impliedVolatility || 0, item.PE?.impliedVolatility || 0])
      .filter((iv) => iv > 0);

    if (allIVs.length === 0) {
      return { current: 0, rank: 0, percentile: 0, high52w: 0, low52w: 0, mean: 0 };
    }

    const currentIV = allIVs.reduce((a, b) => a + b, 0) / allIVs.length;
    const maxIV = Math.max(...allIVs);
    const minIV = Math.min(...allIVs);
    const ivRank = maxIV !== minIV ? ((currentIV - minIV) / (maxIV - minIV)) * 100 : 0;

    return {
      current: Math.round(currentIV * 100) / 100,
      rank: Math.min(100, Math.max(0, Math.round(ivRank))),
      percentile: Math.min(100, Math.max(0, Math.round(ivRank * 0.9))),
      high52w: Math.round(maxIV * 100) / 100,
      low52w: Math.round(minIV * 100) / 100,
      mean: Math.round(((maxIV + minIV) / 2) * 100) / 100,
    };
  }, [data]);

  // OI analysis
  const oiAnalysis = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return {
        maxPainStrike: spotPrice,
        pcr: 0,
        pcrTrend: 'neutral' as const,
        totalCallOI: 0,
        totalPutOI: 0,
        callOIChange: 0,
        putOIChange: 0,
      };
    }

    let totalCallOI = 0;
    let totalPutOI = 0;
    let callOIChange = 0;
    let putOIChange = 0;
    let maxPainStrike = spotPrice;
    let maxOI = 0;

    data.data.forEach((item) => {
      const callOI = item.CE?.openInterest || 0;
      const putOI = item.PE?.openInterest || 0;

      totalCallOI += callOI;
      totalPutOI += putOI;
      callOIChange += item.CE?.changeinOpenInterest || 0;
      putOIChange += item.PE?.changeinOpenInterest || 0;

      if (callOI + putOI > maxOI) {
        maxOI = callOI + putOI;
        maxPainStrike = item.strikePrice;
      }
    });

    const pcr = totalCallOI > 0 ? totalPutOI / totalCallOI : 0;
    const pcrTrend: 'bullish' | 'bearish' | 'neutral' = pcr > 1.2 ? 'bullish' : pcr < 0.8 ? 'bearish' : 'neutral';

    return {
      maxPainStrike,
      pcr: Math.round(pcr * 100) / 100,
      pcrTrend,
      totalCallOI,
      totalPutOI,
      callOIChange,
      putOIChange,
    };
  }, [data, spotPrice]);

  const isConnected = !!data && !error;
  const isUsingRealData = isConnected && data.data && data.data.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Diagnostics Panel */}
      <DiagnosticsPanel diagnostics={diagnostics} />
      
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="border-loss/50 bg-loss/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <span>NSE API: {error}</span>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">F&O Live</h1>
          <p className="text-muted-foreground text-sm">
            Real-time Option Chain & Analytics
            {isUsingRealData && (
              <Badge variant="outline" className="ml-2 text-profit border-profit">NSE Live</Badge>
            )}
            {!isUsingRealData && (
              <Badge variant="outline" className="ml-2">No Live Data</Badge>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {/* Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border">
            {loading ? (
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
            ) : isConnected ? (
              <Wifi className="h-3.5 w-3.5 text-profit" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-loss" />
            )}
            <span className="text-xs font-medium">
              {loading ? 'Loading...' : isConnected ? 'NSE Connected' : 'Disconnected'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Radio className={`h-4 w-4 ${isLive ? 'text-profit animate-pulse' : 'text-muted-foreground'}`} />
            <span className="text-xs text-muted-foreground">
              {isLive ? 'Live' : 'Paused'} • {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
          
          <Select value={selectedSymbol} onValueChange={(val) => {
            setSelectedSymbol(val);
            setSelectedExpiry(''); // Reset expiry on symbol change
          }}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Symbol" />
            </SelectTrigger>
            <SelectContent>
              {SYMBOLS.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedExpiry} onValueChange={setSelectedExpiry}>
            <SelectTrigger className="w-[160px] h-9">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Expiry" />
            </SelectTrigger>
            <SelectContent>
              {(data?.expiryDates || []).map(exp => (
                <SelectItem key={exp} value={exp}>{exp}</SelectItem>
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
          
          <Button variant="ghost" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Market Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MarketOverview data={marketData} />
        <IVRankCard data={ivData} />
        <OIAnalysisCard data={oiAnalysis} />
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

      {/* Data Source Info */}
      {data?.timestamp && (
        <div className="text-center text-xs text-muted-foreground">
          Data from NSE India • Last updated: {data.timestamp}
        </div>
      )}

      {/* Greeks Legend */}
      <div className="stat-card">
        <h3 className="font-semibold text-foreground mb-3">Greeks Reference</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-lg font-mono font-bold text-profit">Δ Delta</span>
            <p className="text-xs text-muted-foreground">
              Rate of change in option price per ₹1 change in underlying.
            </p>
          </div>
          <div>
            <span className="text-lg font-mono font-bold text-chart-2">Γ Gamma</span>
            <p className="text-xs text-muted-foreground">
              Rate of change in Delta. Highest at ATM strikes.
            </p>
          </div>
          <div>
            <span className="text-lg font-mono font-bold text-loss">Θ Theta</span>
            <p className="text-xs text-muted-foreground">
              Time decay - how much value option loses per day.
            </p>
          </div>
          <div>
            <span className="text-lg font-mono font-bold text-chart-4">ν Vega</span>
            <p className="text-xs text-muted-foreground">
              Sensitivity to implied volatility changes.
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 italic">
          Note: Greeks are not provided by NSE. Use a broker API for Greek values.
        </p>
      </div>
    </div>
  );
}
