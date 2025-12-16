import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UploadTradesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedTrade {
  symbol: string;
  side: string;
  quantity: number;
  avg_price: number;
  entry_time: string;
  instrument_type: string;
}

export function UploadTradesDialog({ open, onOpenChange }: UploadTradesDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsedTrades, setParsedTrades] = useState<ParsedTrade[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  const { toast } = useToast();

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast({
          title: 'Invalid File',
          description: 'Please upload a CSV file',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  }, [toast]);

  const parseCSV = async (file: File) => {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());

    const trades: ParsedTrade[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Map common column names
      const trade: ParsedTrade = {
        symbol: row.symbol || row.tradingsymbol || row.scrip || row.instrument || '',
        side: (row.side || row.type || row.buysell || row.transaction_type || '').toUpperCase(),
        quantity: parseInt(row.quantity || row.qty || row.filled_qty || '0'),
        avg_price: parseFloat(row.price || row.avg_price || row.average_price || row.trade_price || '0'),
        entry_time: row.date || row.trade_date || row.time || row.timestamp || new Date().toISOString(),
        instrument_type: row.instrument_type || row.product || 'EQ',
      };

      if (trade.symbol && trade.quantity > 0) {
        trades.push(trade);
      }
    }

    setParsedTrades(trades);
    if (trades.length > 0) {
      setStep('preview');
    } else {
      toast({
        title: 'No Trades Found',
        description: 'Could not parse any trades from the CSV. Please check the format.',
        variant: 'destructive',
      });
    }
  };

  const handleImport = async () => {
    setStep('importing');
    setIsUploading(true);
    setProgress(0);

    try {
      const totalTrades = parsedTrades.length;
      let imported = 0;

      for (const trade of parsedTrades) {
        const { error } = await supabase.from('trades').insert({
          user_id: 'demo-user',
          symbol: trade.symbol,
          side: trade.side === 'BUY' ? 'BUY' : 'SELL',
          quantity: trade.quantity,
          avg_price: trade.avg_price,
          entry_time: trade.entry_time,
          instrument_type: trade.instrument_type,
          source: 'csv_upload',
        });

        if (!error) imported++;
        setProgress(Math.round((imported / totalTrades) * 100));
      }

      toast({
        title: 'Import Complete!',
        description: `Successfully imported ${imported} of ${totalTrades} trades`,
      });

      // Trigger AI analysis for imported trades
      await supabase.functions.invoke('analyze-trades', {
        body: { userId: 'demo-user' },
      });

      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: 'An error occurred while importing trades',
        variant: 'destructive',
      });
      setStep('preview');
    } finally {
      setIsUploading(false);
    }
  };

  const resetDialog = () => {
    setFile(null);
    setParsedTrades([]);
    setStep('upload');
    setProgress(0);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetDialog();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 'upload' && 'Upload Trade History'}
            {step === 'preview' && 'Preview Trades'}
            {step === 'importing' && 'Importing Trades'}
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Upload a CSV file exported from your broker'}
            {step === 'preview' && `Found ${parsedTrades.length} trades to import`}
            {step === 'importing' && 'Please wait while we import your trades'}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="py-4">
            <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <Upload className="h-10 w-10 text-muted-foreground mb-3" />
              <span className="text-sm font-medium">Drop CSV file here or click to browse</span>
              <span className="text-xs text-muted-foreground mt-1">Supports Zerodha, Upstox, Angel One, Fyers format</span>
            </label>

            <div className="mt-6 p-4 rounded-lg bg-muted/30">
              <h4 className="font-medium text-sm mb-2">Expected CSV columns:</h4>
              <div className="flex flex-wrap gap-2">
                {['symbol', 'side/type', 'quantity', 'price', 'date'].map((col) => (
                  <span key={col} className="px-2 py-1 bg-muted rounded text-xs font-mono">
                    {col}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="py-4 space-y-4">
            <div className="max-h-64 overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Symbol</th>
                    <th className="px-3 py-2 text-left font-medium">Side</th>
                    <th className="px-3 py-2 text-right font-medium">Qty</th>
                    <th className="px-3 py-2 text-right font-medium">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {parsedTrades.slice(0, 10).map((trade, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-medium">{trade.symbol}</td>
                      <td className={`px-3 py-2 ${trade.side === 'BUY' ? 'text-profit' : 'text-loss'}`}>
                        {trade.side}
                      </td>
                      <td className="px-3 py-2 text-right">{trade.quantity}</td>
                      <td className="px-3 py-2 text-right">₹{trade.avg_price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedTrades.length > 10 && (
                <div className="px-3 py-2 text-center text-xs text-muted-foreground bg-muted/30">
                  +{parsedTrades.length - 10} more trades
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('upload')} className="flex-1">
                Choose Different File
              </Button>
              <Button onClick={handleImport} className="flex-1">
                Import {parsedTrades.length} Trades
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="py-8 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing trades...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span>AI is analyzing your trading patterns...</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
