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
import { AIAnalysis } from '@/components/live/AIAnalysis';
import { TradeAssist } from '@/components/live/TradeAssist';
import { useNseData } from '@/hooks/useNseData';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { calculateOptionGreeks } from '@/utils/greeks';
// Removed mock data imports - using only real NSE data
import { Alert, AlertDescription } from '@/components/ui/alert';

const SYMBOLS = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];

export default function Live() {
  console.log('[Live] Component mounted/rendered');
  
  const [selectedSymbol, setSelectedSymbol] = useState('NIFTY');
  const [selectedExpiry, setSelectedExpiry] = useState<string>('');
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  const { loading, error, data, diagnostics, fetchOptionChain } = useNseData();
  const { fetchHistoricalData } = useHistoricalData();
  const { analyses: aiAnalyses, loading: aiLoading, analyzeTimeframe } = useAIAnalysis();
  
  // Log on mount
  useEffect(() => {
    console.log('[Live] Component mounted - Initial load');
  }, []);

  // Fetch data on mount and when symbol/expiry changes
  const loadData = useCallback(async () => {
    console.log('📊 Loading NSE data for', selectedSymbol, selectedExpiry || '(default expiry)');
    try {
      const result = await fetchOptionChain(selectedSymbol, selectedExpiry || undefined);
      if (result) {
        console.log('📊 NSE data received:', {
          success: result.success,
          dataLength: result.data?.length || 0,
          spotPrice: result.spotPrice,
          expiryDates: result.expiryDates?.length || 0,
        });
        setLastUpdate(new Date());
        // Set first expiry as default if not set
        if (!selectedExpiry && result.expiryDates?.length > 0) {
          setSelectedExpiry(result.expiryDates[0]);
        }
      } else {
        console.warn('📊 No data returned from fetchOptionChain');
      }
    } catch (err) {
      console.error('📊 Error loading NSE data:', err);
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

  // Auto-refresh every 2 seconds when live (configurable 1-3 seconds for real-time)
  useEffect(() => {
    if (!isLive) return;
    
    const interval = setInterval(() => {
      console.log('⏰ Auto-refresh');
      loadData();
    }, 2000); // 2 seconds for real-time updates
    
    return () => clearInterval(interval);
  }, [isLive, loadData]);

  // Spot price - MUST be defined before transformedOptionChain
  const spotPrice = useMemo(() => {
    return data?.spotPrice || data?.indexQuote?.last || 0;
  }, [data]);

  // Transform NSE data to component format with calculated Greeks
  // NO MOCK DATA - Only real NSE data
  const transformedOptionChain = useMemo(() => {
    // Only use real NSE data - no mock fallback
    if (!data?.data || data.data.length === 0) {
      console.log('⚠️ No option chain data available from NSE');
      return [];
    }

    console.log(`✅ Transforming ${data.data.length} strikes from NSE with Greeks calculation`);

    const currentSpot = spotPrice || data.spotPrice || 0;
    const expiryDate = data.selectedExpiry || data.expiryDates?.[0] || '';
    
    if (!currentSpot || currentSpot === 0) {
      console.warn('⚠️ No spot price available for Greeks calculation');
    }
    if (!expiryDate) {
      console.warn('⚠️ No expiry date available for Greeks calculation');
    }

    return data.data
      .map((item) => {
        // Calculate Greeks for Call option
        let callGreeks = { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
        if (item.CE && item.CE.impliedVolatility > 0 && expiryDate && currentSpot > 0 && item.strikePrice > 0) {
          try {
            callGreeks = calculateOptionGreeks(
              currentSpot,
              item.strikePrice,
              expiryDate,
              item.CE.impliedVolatility,
              'call',
              0.065 // 6.5% risk-free rate
            );
            // Validate Greeks are not NaN or Infinity
            if (!isFinite(callGreeks.delta)) callGreeks.delta = 0;
            if (!isFinite(callGreeks.gamma)) callGreeks.gamma = 0;
            if (!isFinite(callGreeks.theta)) callGreeks.theta = 0;
            if (!isFinite(callGreeks.vega)) callGreeks.vega = 0;
            if (!isFinite(callGreeks.rho)) callGreeks.rho = 0;
          } catch (e) {
            console.warn('Error calculating call Greeks for strike', item.strikePrice, e);
          }
        }

        // Calculate Greeks for Put option
        let putGreeks = { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
        if (item.PE && item.PE.impliedVolatility > 0 && expiryDate && currentSpot > 0 && item.strikePrice > 0) {
          try {
            putGreeks = calculateOptionGreeks(
              currentSpot,
              item.strikePrice,
              expiryDate,
              item.PE.impliedVolatility,
              'put',
              0.065 // 6.5% risk-free rate
            );
            // Validate Greeks are not NaN or Infinity
            if (!isFinite(putGreeks.delta)) putGreeks.delta = 0;
            if (!isFinite(putGreeks.gamma)) putGreeks.gamma = 0;
            if (!isFinite(putGreeks.theta)) putGreeks.theta = 0;
            if (!isFinite(putGreeks.vega)) putGreeks.vega = 0;
            if (!isFinite(putGreeks.rho)) putGreeks.rho = 0;
          } catch (e) {
            console.warn('Error calculating put Greeks for strike', item.strikePrice, e);
          }
        }

        return {
          strike: item.strikePrice,
          callLTP: item.CE?.lastPrice || 0,
          callOI: item.CE?.openInterest || 0,
          callOIChange: item.CE?.changeinOpenInterest || 0,
          callVolume: item.CE?.totalTradedVolume || 0,
          callIV: item.CE?.impliedVolatility || 0,
          callDelta: callGreeks.delta,
          callGamma: callGreeks.gamma,
          callTheta: callGreeks.theta,
          callVega: callGreeks.vega,
          putLTP: item.PE?.lastPrice || 0,
          putOI: item.PE?.openInterest || 0,
          putOIChange: item.PE?.changeinOpenInterest || 0,
          putVolume: item.PE?.totalTradedVolume || 0,
          putIV: item.PE?.impliedVolatility || 0,
          putDelta: putGreeks.delta,
          putGamma: putGreeks.gamma,
          putTheta: putGreeks.theta,
          putVega: putGreeks.vega,
        };
      })
      .sort((a, b) => a.strike - b.strike);
  }, [data, spotPrice]);

  // Market data - ONLY real NSE data
  const marketData = useMemo(() => {
    if (!data || !data.indexQuote) {
      console.log('⚠️ No market data from NSE');
      return {
        symbol: selectedSymbol,
        spotPrice: spotPrice || 0,
        change: 0,
        changePercent: 0,
        high: spotPrice || 0,
        low: spotPrice || 0,
        open: spotPrice || 0,
        prevClose: spotPrice || 0,
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

  // IV data from option chain - ONLY real NSE data
  const ivData = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      console.log('⚠️ No IV data from NSE');
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

  // OI analysis - ONLY real NSE data
  const oiAnalysis = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      console.log('⚠️ No OI data from NSE');
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

  // Auto-run AI Analysis for multiple timeframes with different intervals
  useEffect(() => {
    if (!transformedOptionChain.length || !spotPrice || spotPrice === 0 || !isLive) {
      return;
    }

    const runAIAnalysis = async (timeframe: '1m' | '5m' | '15m') => {
      try {
        // Fetch historical data for the timeframe
        const historicalCandles = await fetchHistoricalData({
          symbol: selectedSymbol,
          timeframe,
          limit: 100,
          currentSpotPrice: spotPrice,
        });

        if (historicalCandles.length >= 20) {
          await analyzeTimeframe(timeframe, historicalCandles, transformedOptionChain, spotPrice);
        }
      } catch (err) {
        console.error(`Error in AI analysis for ${timeframe}:`, err);
      }
    };

    // Initial analysis for all timeframes
    runAIAnalysis('1m');
    runAIAnalysis('5m');
    runAIAnalysis('15m');

    // Set up auto-refresh intervals
    // 1m: every 1 minute
    const interval1m = setInterval(() => {
      if (isLive) runAIAnalysis('1m');
    }, 60000);

    // 5m: every 5 minutes
    const interval5m = setInterval(() => {
      if (isLive) runAIAnalysis('5m');
    }, 300000);

    // 15m: every 15 minutes
    const interval15m = setInterval(() => {
      if (isLive) runAIAnalysis('15m');
    }, 900000);

    return () => {
      clearInterval(interval1m);
      clearInterval(interval5m);
      clearInterval(interval15m);
    };
  }, [transformedOptionChain, spotPrice, selectedSymbol, isLive, fetchHistoricalData, analyzeTimeframe]);

  const isConnected = !!data && !error;
  const isUsingRealData = isConnected && data?.data && data.data.length > 0;

  // Always render the page - never return null
  console.log('[Live] Component rendering - Data:', {
    hasData: !!data,
    dataLength: data?.data?.length || 0,
    spotPrice,
    isConnected,
    isUsingRealData,
    error,
    loading,
    diagnostics: diagnostics.status,
  });
  
  // Debug: Log raw data structure
  if (data) {
    console.log('[Live] Raw data structure:', {
      success: data.success,
      symbol: data.symbol,
      spotPrice: data.spotPrice,
      dataLength: data.data?.length,
      expiryDates: data.expiryDates?.length,
      selectedExpiry: data.selectedExpiry,
      firstItem: data.data?.[0],
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Diagnostics Panel */}
      <DiagnosticsPanel diagnostics={diagnostics} />
      
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="border-loss/50 bg-loss/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">NSE API Error: {error}</span>
            <br />
            <span className="text-xs mt-1 block">
              Check Diagnostics Panel above for details. Market may be closed or NSE API may be blocking requests.
            </span>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Market Closed / No Data Alert */}
      {!loading && !error && transformedOptionChain.length === 0 && (
        <Alert className={data?.marketClosed ? "border-info/50 bg-info/10" : "border-warning/50 bg-warning/10"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">
              {data?.marketClosed ? 'Market is Closed' : 'No Option Chain Data Available'}
            </span>
            <br />
            <span className="text-xs mt-1 block">
              {data?.message || (
                <>
                  NSE trading hours: 9:15 AM - 3:30 PM IST (Monday-Friday)
                  <br />
                  Option chain data is only available during market hours.
                  <br />
                  Spot price is still updated from previous close.
                </>
              )}
            </span>
            {!data?.marketClosed && (
              <span className="text-xs mt-2 block">
                Check Diagnostics Panel above for details. Click Refresh button to retry.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Market Analysis</h1>
          <p className="text-muted-foreground text-sm">
            Real-time Option Chain & Analytics
            {isUsingRealData && (
              <Badge variant="outline" className="ml-2 text-profit border-profit">NSE Live</Badge>
            )}
            {!isUsingRealData && loading && (
              <Badge variant="outline" className="ml-2 text-warning border-warning">Loading...</Badge>
            )}
            {!isUsingRealData && !loading && error && (
              <Badge variant="outline" className="ml-2 text-loss border-loss">Error</Badge>
            )}
            {!isUsingRealData && !loading && !error && transformedOptionChain.length === 0 && data?.message && (
              <Badge variant="outline" className="ml-2 text-warning border-warning">
                {data.message.includes('Market is closed') ? 'Market Closed' : 'No Data'}
              </Badge>
            )}
            {!isUsingRealData && !loading && !error && transformedOptionChain.length === 0 && !data?.message && (
              <Badge variant="outline" className="ml-2 text-muted-foreground border-muted-foreground">Waiting for Data</Badge>
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
          {loading ? (
            <div className="stat-card">
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground mr-3" />
                <span className="text-muted-foreground">Loading option chain data from NSE...</span>
              </div>
            </div>
          ) : (
            <OptionChainTable data={transformedOptionChain} spotPrice={spotPrice} />
          )}
        </div>
        <div>
          <OIChart data={transformedOptionChain} spotPrice={spotPrice} />
        </div>
      </div>

      {/* AI Analysis & Trade Assist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AIAnalysis analysis={aiAnalyses} loading={aiLoading} spotPrice={spotPrice} />
        <TradeAssist 
          analysis={Object.values(aiAnalyses)} 
          spotPrice={spotPrice}
          atmStrike={transformedOptionChain.find(opt => Math.abs(opt.strike - spotPrice) <= 25)?.strike}
        />
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
