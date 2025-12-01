export type InstrumentType = 'FUT' | 'OPT' | 'EQ';
export type OptionType = 'CE' | 'PE' | null;
export type Side = 'BUY' | 'SELL';
export type TradeStatus = 'OPEN' | 'CLOSED' | 'PARTIAL';
export type EmotionLevel = 1 | 2 | 3 | 4 | 5;

export interface Trade {
  id: string;
  symbol: string;
  underlying: string;
  instrumentType: InstrumentType;
  expiry: string | null;
  strike: number | null;
  optionType: OptionType;
  side: Side;
  quantity: number;
  lotSize: number;
  avgPrice: number;
  exitPrice: number | null;
  stopLoss: number | null;
  targetPrice: number | null;
  entryTime: string;
  exitTime: string | null;
  brokerage: number;
  taxes: number;
  pnl: number;
  status: TradeStatus;
  strategy: string;
  setup: string;
  notes: string;
  screenshotUrl: string | null;
  tags: string[];
  emotion: EmotionLevel;
  confidence: number;
  ruleAdherence: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DailyStats {
  date: string;
  trades: number;
  winners: number;
  losers: number;
  pnl: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
}

export interface PortfolioStats {
  totalPnl: number;
  totalTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
  expectancy: number;
  bestDay: DailyStats | null;
  worstDay: DailyStats | null;
}

export interface PsychologyEntry {
  id: string;
  date: string;
  preMarketMood: EmotionLevel;
  marketBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  notes: string;
  biases: string[];
  postSessionReflection: string;
  lessonsLearned: string;
}
