-- Create broker connections table
CREATE TABLE public.broker_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  broker_name TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  client_id TEXT,
  is_connected BOOLEAN DEFAULT false,
  connected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create imported trades table
CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  broker_connection_id UUID REFERENCES public.broker_connections(id),
  symbol TEXT NOT NULL,
  underlying TEXT,
  instrument_type TEXT NOT NULL,
  expiry DATE,
  strike DECIMAL,
  option_type TEXT,
  side TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  lot_size INTEGER DEFAULT 1,
  avg_price DECIMAL NOT NULL,
  exit_price DECIMAL,
  stop_loss DECIMAL,
  target_price DECIMAL,
  entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
  exit_time TIMESTAMP WITH TIME ZONE,
  brokerage DECIMAL DEFAULT 0,
  taxes DECIMAL DEFAULT 0,
  pnl DECIMAL DEFAULT 0,
  status TEXT DEFAULT 'OPEN',
  strategy TEXT,
  setup TEXT,
  notes TEXT,
  tags TEXT[],
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI analysis table
CREATE TABLE public.trade_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id UUID REFERENCES public.trades(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  psychology_tags TEXT[],
  emotion_score INTEGER,
  greed_indicator BOOLEAN DEFAULT false,
  fear_indicator BOOLEAN DEFAULT false,
  fomo_indicator BOOLEAN DEFAULT false,
  revenge_trade BOOLEAN DEFAULT false,
  overtrading BOOLEAN DEFAULT false,
  ai_suggestion TEXT,
  ai_analysis TEXT,
  risk_reward_ratio DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create capital/fund flow table
CREATE TABLE public.fund_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  broker_connection_id UUID REFERENCES public.broker_connections(id),
  flow_type TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  flow_date TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.broker_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_flows ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for now (will add auth later)
CREATE POLICY "Allow all operations on broker_connections" ON public.broker_connections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on trades" ON public.trades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on trade_analysis" ON public.trade_analysis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on fund_flows" ON public.fund_flows FOR ALL USING (true) WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_broker_connections_updated_at BEFORE UPDATE ON public.broker_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON public.trades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();