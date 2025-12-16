import { useState } from 'react';
import { Link2, Upload, ArrowRight, TrendingUp, Brain, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConnectBrokerDialog } from '@/components/onboarding/ConnectBrokerDialog';
import { UploadTradesDialog } from '@/components/onboarding/UploadTradesDialog';

export default function Onboarding() {
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-4xl w-full space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Brain className="h-4 w-4" />
            AI-Powered Trading Analysis
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Understand Your <span className="text-primary">Trading Psychology</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect your broker or upload trades to get AI-powered insights on emotional trading, 
            greed patterns, FOMO, and personalized suggestions for every trade.
          </p>
        </div>

        {/* Main Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Connect Broker Card */}
          <Card className="group cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10" onClick={() => setShowConnectDialog(true)}>
            <CardHeader className="space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Link2 className="h-7 w-7 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Connect Broker</CardTitle>
                <CardDescription className="mt-2">
                  Auto-sync all your trades, deposits, withdrawals, and P&L in real-time
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-profit" />
                  <span>Automatic trade import</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-profit" />
                  <span>Real-time P&L tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-profit" />
                  <span>Fund flow analysis</span>
                </div>
              </div>
              <Button className="w-full group-hover:bg-primary transition-colors">
                Connect Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Upload Trades Card */}
          <Card className="group cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10" onClick={() => setShowUploadDialog(true)}>
            <CardHeader className="space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-secondary/50 flex items-center justify-center group-hover:bg-secondary transition-colors">
                <Upload className="h-7 w-7 text-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl">Upload Trades</CardTitle>
                <CardDescription className="mt-2">
                  Import your trade history from CSV files exported from any broker
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                  <span>Support for all brokers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                  <span>Bulk trade import</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                  <span>Manual entry option</span>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                Upload CSV <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 pt-8">
          <div className="text-center space-y-2">
            <div className="h-10 w-10 rounded-xl bg-profit/10 flex items-center justify-center mx-auto">
              <TrendingUp className="h-5 w-5 text-profit" />
            </div>
            <p className="text-sm font-medium">Performance Analytics</p>
          </div>
          <div className="text-center space-y-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium">AI Psychology Analysis</p>
          </div>
          <div className="text-center space-y-2">
            <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center mx-auto">
              <Shield className="h-5 w-5 text-foreground" />
            </div>
            <p className="text-sm font-medium">Secure & Private</p>
          </div>
        </div>
      </div>

      <ConnectBrokerDialog open={showConnectDialog} onOpenChange={setShowConnectDialog} />
      <UploadTradesDialog open={showUploadDialog} onOpenChange={setShowUploadDialog} />
    </div>
  );
}
