import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MstockResponse {
  status: boolean;
  message: string;
  errorcode?: string;
  data: any;
}

interface UseMstockDataReturn {
  loading: boolean;
  error: string | null;
  optionChainMaster: any | null;
  optionChainData: any | null;
  fetchOptionChainMaster: (exchange?: number) => Promise<void>;
  fetchOptionChain: (expiry: number, token: number, exchange?: number) => Promise<void>;
  fetchQuote: (token: number, exchange?: number) => Promise<any>;
}

export function useMstockData(): UseMstockDataReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optionChainMaster, setOptionChainMaster] = useState<any | null>(null);
  const [optionChainData, setOptionChainData] = useState<any | null>(null);

  const callMstockApi = useCallback(async (body: Record<string, any>): Promise<MstockResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('mstock-option-chain', {
        body
      });

      if (fnError) {
        console.error('Supabase function error:', fnError);
        const errorMessage = fnError.message || 'Failed to call mStock API';
        setError(errorMessage);
        toast.error(errorMessage);
        return null;
      }

      if (data?.error) {
        console.error('mStock API error:', data);
        const errorMessage = data.message || data.error || 'mStock API error';
        setError(errorMessage);
        toast.error(errorMessage);
        return null;
      }

      return data as MstockResponse;
    } catch (err) {
      console.error('Network error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOptionChainMaster = useCallback(async (exchange: number = 2) => {
    const data = await callMstockApi({ action: 'getOptionChainMaster', exchange });
    if (data) {
      setOptionChainMaster(data.data);
      console.log('Option chain master loaded:', data.data);
    }
  }, [callMstockApi]);

  const fetchOptionChain = useCallback(async (expiry: number, token: number, exchange: number = 2) => {
    const data = await callMstockApi({ action: 'getOptionChain', exchange, expiry, token });
    if (data) {
      setOptionChainData(data.data);
      console.log('Option chain data loaded:', data.data);
    }
  }, [callMstockApi]);

  const fetchQuote = useCallback(async (token: number, exchange: number = 1): Promise<any> => {
    const data = await callMstockApi({ action: 'getQuote', exchange, token });
    return data?.data || null;
  }, [callMstockApi]);

  return {
    loading,
    error,
    optionChainMaster,
    optionChainData,
    fetchOptionChainMaster,
    fetchOptionChain,
    fetchQuote
  };
}
