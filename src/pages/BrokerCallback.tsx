import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function BrokerCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing broker authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage('Authentication was cancelled or failed');
        setTimeout(() => navigate('/onboarding'), 3000);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Invalid callback parameters');
        setTimeout(() => navigate('/onboarding'), 3000);
        return;
      }

      try {
        // Parse state to get broker info
        const stateData = JSON.parse(atob(state));
        const { broker, userId } = stateData;

        setMessage(`Connecting to ${broker}...`);

        // Exchange code for tokens via edge function
        const { data, error: fnError } = await supabase.functions.invoke('broker-oauth', {
          body: { code, broker, userId }
        });

        if (fnError) throw fnError;

        setMessage('Fetching your trades and fund flows...');

        // Fetch trades from broker
        const { error: syncError } = await supabase.functions.invoke('sync-broker-data', {
          body: { broker, userId, accessToken: data.access_token }
        });

        if (syncError) throw syncError;

        setMessage('Analyzing your trading patterns...');

        // Run AI analysis
        await supabase.functions.invoke('analyze-trades', {
          body: { userId }
        });

        setStatus('success');
        setMessage('Successfully connected! Redirecting to dashboard...');
        
        toast({
          title: 'Broker Connected!',
          description: 'All your trades have been imported and analyzed.',
        });

        setTimeout(() => navigate('/'), 2000);
      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setMessage('Failed to complete connection. Please try again.');
        setTimeout(() => navigate('/onboarding'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="text-center space-y-6 p-8">
        {status === 'processing' && (
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
        )}
        {status === 'success' && (
          <CheckCircle2 className="h-16 w-16 text-profit mx-auto" />
        )}
        {status === 'error' && (
          <XCircle className="h-16 w-16 text-loss mx-auto" />
        )}
        <p className="text-lg text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
