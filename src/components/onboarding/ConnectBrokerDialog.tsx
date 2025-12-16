import { useState } from 'react';
import { ExternalLink, Shield, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ConnectBrokerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const brokers = [
  { 
    id: 'upstox', 
    name: 'Upstox', 
    logo: '📈', 
    description: 'One-click login', 
    popular: true,
    oauthUrl: 'https://api.upstox.com/v2/login/authorization/dialog',
    clientId: 'YOUR_UPSTOX_CLIENT_ID', // Will be replaced with env var
  },
  { 
    id: 'angelone', 
    name: 'Angel One', 
    logo: '👼', 
    description: 'SmartAPI Login', 
    popular: true,
    oauthUrl: 'https://smartapi.angelone.in/publisher-login',
    clientId: 'YOUR_ANGELONE_CLIENT_ID',
  },
  { 
    id: 'fyers', 
    name: 'Fyers', 
    logo: '🎯', 
    description: 'Secure OAuth', 
    popular: false,
    oauthUrl: 'https://api-t1.fyers.in/api/v3/generate-authcode',
    clientId: 'YOUR_FYERS_CLIENT_ID',
  },
  { 
    id: 'zerodha', 
    name: 'Zerodha', 
    logo: '🦓', 
    description: 'Kite Connect', 
    popular: false,
    oauthUrl: 'https://kite.zerodha.com/connect/login',
    clientId: 'YOUR_ZERODHA_CLIENT_ID',
  },
];

export function ConnectBrokerDialog({ open, onOpenChange }: ConnectBrokerDialogProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { toast } = useToast();

  const handleBrokerSelect = (brokerId: string) => {
    const broker = brokers.find(b => b.id === brokerId);
    if (!broker) return;

    setIsRedirecting(true);

    // Generate a unique user ID (in production, use actual auth user ID)
    const userId = `user_${Date.now()}`;
    
    // Create state parameter with broker info
    const state = btoa(JSON.stringify({ broker: brokerId, userId }));
    
    // Get redirect URI (current origin + callback path)
    const redirectUri = `${window.location.origin}/broker-callback`;

    // Build OAuth URL based on broker
    let oauthUrl = '';
    
    if (brokerId === 'upstox') {
      oauthUrl = `${broker.oauthUrl}?client_id=${broker.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&response_type=code`;
    } else if (brokerId === 'angelone') {
      oauthUrl = `${broker.oauthUrl}?api_key=${broker.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    } else if (brokerId === 'fyers') {
      oauthUrl = `${broker.oauthUrl}?client_id=${broker.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&response_type=code`;
    } else if (brokerId === 'zerodha') {
      oauthUrl = `${broker.oauthUrl}?v=3&api_key=${broker.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    }

    toast({
      title: 'Redirecting to broker...',
      description: `You'll be redirected to ${broker.name} to login securely.`,
    });

    // For demo purposes, show a message that OAuth needs to be configured
    // In production, this would redirect to the broker's OAuth page
    setTimeout(() => {
      toast({
        title: 'OAuth Configuration Required',
        description: 'Please configure your broker API credentials in the edge function secrets.',
        variant: 'destructive',
      });
      setIsRedirecting(false);
    }, 2000);

    // Uncomment this line when OAuth credentials are configured:
    // window.location.href = oauthUrl;
  };

  const resetDialog = () => {
    setIsRedirecting(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetDialog();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Connect Your Demat Account</DialogTitle>
          <DialogDescription>
            Login securely with your broker to auto-import all trades, deposits & withdrawals
          </DialogDescription>
        </DialogHeader>

        {!isRedirecting ? (
          <div className="space-y-4 py-4">
            {/* Benefits */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-profit" />
                <span>Bank-level security</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4 text-primary" />
                <span>Instant sync</span>
              </div>
            </div>

            {/* Broker Grid */}
            <div className="grid grid-cols-2 gap-3">
              {brokers.map((broker) => (
                <button
                  key={broker.id}
                  onClick={() => handleBrokerSelect(broker.id)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all hover:border-primary/50 hover:bg-primary/5 ${
                    broker.popular ? 'border-primary/30' : 'border-border'
                  }`}
                >
                  {broker.popular && (
                    <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                      Popular
                    </span>
                  )}
                  <div className="text-2xl mb-2">{broker.logo}</div>
                  <div className="font-semibold">{broker.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    {broker.description}
                    <ExternalLink className="h-3 w-3" />
                  </div>
                </button>
              ))}
            </div>

            <p className="text-xs text-center text-muted-foreground pt-2">
              We never store your broker password. Authentication is handled securely by your broker.
            </p>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-muted-foreground">Redirecting to broker login...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
