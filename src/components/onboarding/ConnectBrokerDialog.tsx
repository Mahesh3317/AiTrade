import { useState } from 'react';
import { ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ConnectBrokerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const brokers = [
  { id: 'upstox', name: 'Upstox', logo: '📈', description: 'Free API access', popular: true },
  { id: 'angelone', name: 'Angel One', logo: '👼', description: 'SmartAPI (Free)', popular: true },
  { id: 'fyers', name: 'Fyers', logo: '🎯', description: 'Free API access', popular: false },
  { id: 'zerodha', name: 'Zerodha', logo: '🦓', description: 'Kite Connect (₹2000/mo)', popular: false },
];

export function ConnectBrokerDialog({ open, onOpenChange }: ConnectBrokerDialogProps) {
  const [selectedBroker, setSelectedBroker] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'credentials' | 'connecting'>('select');
  const [credentials, setCredentials] = useState({ apiKey: '', apiSecret: '', clientId: '' });
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    if (!selectedBroker) return;
    
    setIsConnecting(true);
    setStep('connecting');

    try {
      // Store broker connection (in a real app, this would initiate OAuth)
      const { error } = await supabase.from('broker_connections').insert({
        user_id: 'demo-user', // Replace with actual user ID when auth is added
        broker_name: selectedBroker,
        client_id: credentials.clientId,
        is_connected: true,
        connected_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: 'Broker Connected!',
        description: `Successfully connected to ${brokers.find(b => b.id === selectedBroker)?.name}`,
      });

      // Redirect to dashboard
      window.location.href = '/';
    } catch (error) {
      console.error('Error connecting broker:', error);
      toast({
        title: 'Connection Failed',
        description: 'Unable to connect to broker. Please try again.',
        variant: 'destructive',
      });
      setStep('credentials');
    } finally {
      setIsConnecting(false);
    }
  };

  const resetDialog = () => {
    setSelectedBroker(null);
    setStep('select');
    setCredentials({ apiKey: '', apiSecret: '', clientId: '' });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetDialog();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 'select' && 'Choose Your Broker'}
            {step === 'credentials' && `Connect to ${brokers.find(b => b.id === selectedBroker)?.name}`}
            {step === 'connecting' && 'Connecting...'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select' && 'Select your broker to auto-import all your trades and fund flows'}
            {step === 'credentials' && 'Enter your API credentials to connect securely'}
            {step === 'connecting' && 'Please wait while we establish connection'}
          </DialogDescription>
        </DialogHeader>

        {step === 'select' && (
          <div className="grid grid-cols-2 gap-3 py-4">
            {brokers.map((broker) => (
              <button
                key={broker.id}
                onClick={() => {
                  setSelectedBroker(broker.id);
                  setStep('credentials');
                }}
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
                <div className="text-xs text-muted-foreground">{broker.description}</div>
              </button>
            ))}
          </div>
        )}

        {step === 'credentials' && (
          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-muted/50 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-xs text-muted-foreground">
                Get your API credentials from{' '}
                <a 
                  href={`https://${selectedBroker === 'upstox' ? 'api.upstox.com' : selectedBroker === 'angelone' ? 'smartapi.angelone.in' : selectedBroker === 'fyers' ? 'api-t1.fyers.in' : 'kite.trade'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  {selectedBroker}'s developer portal <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID / User ID</Label>
              <Input
                id="clientId"
                placeholder="Enter your client ID"
                value={credentials.clientId}
                onChange={(e) => setCredentials({ ...credentials, clientId: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                placeholder="Enter your API key"
                value={credentials.apiKey}
                onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiSecret">API Secret</Label>
              <Input
                id="apiSecret"
                type="password"
                placeholder="Enter your API secret"
                value={credentials.apiSecret}
                onChange={(e) => setCredentials({ ...credentials, apiSecret: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep('select')} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleConnect} 
                className="flex-1"
                disabled={!credentials.apiKey || !credentials.clientId}
              >
                Connect
              </Button>
            </div>
          </div>
        )}

        {step === 'connecting' && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-muted-foreground">Establishing secure connection...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
