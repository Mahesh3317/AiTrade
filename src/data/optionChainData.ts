// Mock data for F&O Live page

export interface OptionData {
  strike: number;
  callOI: number;
  callOIChange: number;
  callVolume: number;
  callIV: number;
  callLTP: number;
  callDelta: number;
  callGamma: number;
  callTheta: number;
  callVega: number;
  putOI: number;
  putOIChange: number;
  putVolume: number;
  putIV: number;
  putLTP: number;
  putDelta: number;
  putGamma: number;
  putTheta: number;
  putVega: number;
}

export interface MarketData {
  symbol: string;
  spotPrice: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
}

export interface IVData {
  current: number;
  rank: number;
  percentile: number;
  high52w: number;
  low52w: number;
  mean: number;
}

export interface OIAnalysis {
  maxPainStrike: number;
  pcr: number;
  pcrTrend: 'bullish' | 'bearish' | 'neutral';
  totalCallOI: number;
  totalPutOI: number;
  callOIChange: number;
  putOIChange: number;
}

const spotPrice = 24250;

export const mockMarketData: MarketData = {
  symbol: 'NIFTY',
  spotPrice: spotPrice,
  change: 125.50,
  changePercent: 0.52,
  high: 24320,
  low: 24180,
  open: 24200,
  prevClose: 24124.50
};

export const mockIVData: IVData = {
  current: 14.2,
  rank: 32,
  percentile: 28,
  high52w: 28.5,
  low52w: 10.2,
  mean: 15.8
};

export const mockOIAnalysis: OIAnalysis = {
  maxPainStrike: 24300,
  pcr: 1.24,
  pcrTrend: 'bullish',
  totalCallOI: 12450000,
  totalPutOI: 15438000,
  callOIChange: -234500,
  putOIChange: 567800
};

export const generateOptionChain = (): OptionData[] => {
  const strikes: OptionData[] = [];
  const baseStrike = Math.round(spotPrice / 50) * 50;
  
  for (let i = -15; i <= 15; i++) {
    const strike = baseStrike + (i * 50);
    const distanceFromSpot = (spotPrice - strike) / spotPrice;
    
    // Simulate realistic IV smile
    const atmIV = 14;
    const ivSkew = Math.abs(distanceFromSpot) * 30;
    const callIV = atmIV + ivSkew + (distanceFromSpot > 0 ? -2 : 2);
    const putIV = atmIV + ivSkew + (distanceFromSpot > 0 ? 2 : -2);
    
    // Simulate Greeks based on moneyness
    const callDelta = Math.max(0.01, Math.min(0.99, 0.5 + distanceFromSpot * 3));
    const putDelta = callDelta - 1;
    const gamma = 0.002 * Math.exp(-Math.pow(distanceFromSpot * 10, 2));
    const theta = -5 - Math.random() * 10;
    const vega = 10 + Math.random() * 5;
    
    // Simulate OI with max pain around 24300
    const oiMultiplier = 1 - Math.abs((strike - 24300) / 1000);
    const baseOI = 500000 + Math.random() * 500000;
    
    strikes.push({
      strike,
      callOI: Math.round(baseOI * oiMultiplier * (strike > spotPrice ? 1.2 : 0.8)),
      callOIChange: Math.round((Math.random() - 0.4) * 50000),
      callVolume: Math.round(Math.random() * 100000),
      callIV: Math.round(callIV * 10) / 10,
      callLTP: Math.max(0.5, Math.round((spotPrice - strike + 100 * callIV / 100) * (callDelta > 0.5 ? 1 : 0.5) * 10) / 10),
      callDelta: Math.round(callDelta * 100) / 100,
      callGamma: Math.round(gamma * 10000) / 10000,
      callTheta: Math.round(theta * 10) / 10,
      callVega: Math.round(vega * 10) / 10,
      putOI: Math.round(baseOI * oiMultiplier * (strike < spotPrice ? 1.3 : 0.7)),
      putOIChange: Math.round((Math.random() - 0.5) * 50000),
      putVolume: Math.round(Math.random() * 100000),
      putIV: Math.round(putIV * 10) / 10,
      putLTP: Math.max(0.5, Math.round((strike - spotPrice + 100 * putIV / 100) * (putDelta < -0.5 ? 1 : 0.5) * 10) / 10),
      putDelta: Math.round(putDelta * 100) / 100,
      putGamma: Math.round(gamma * 10000) / 10000,
      putTheta: Math.round(theta * 10) / 10,
      putVega: Math.round(vega * 10) / 10,
    });
  }
  
  return strikes;
};

export const mockOptionChain = generateOptionChain();

export const expiryDates = [
  { label: '12 Dec 2024', value: '2024-12-12', daysToExpiry: 6 },
  { label: '19 Dec 2024', value: '2024-12-19', daysToExpiry: 13 },
  { label: '26 Dec 2024', value: '2024-12-26', daysToExpiry: 20 },
  { label: '02 Jan 2025', value: '2025-01-02', daysToExpiry: 27 },
];

export const symbols = [
  { label: 'NIFTY', value: 'NIFTY' },
  { label: 'BANKNIFTY', value: 'BANKNIFTY' },
  { label: 'FINNIFTY', value: 'FINNIFTY' },
  { label: 'MIDCPNIFTY', value: 'MIDCPNIFTY' },
];
