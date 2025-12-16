import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Activity, Clock, Database, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export interface DiagnosticsData {
  lastRequestTime: string | null;
  latencyMs: number | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  httpStatus: number | null;
  payloadSize: number | null;
  strikesCount: number;
  expiryDatesCount: number;
  spotPrice: number | null;
  errorMessage: string | null;
  rawResponse: any | null;
}

interface DiagnosticsPanelProps {
  diagnostics: DiagnosticsData;
}

export function DiagnosticsPanel({ diagnostics }: DiagnosticsPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  const statusColor = {
    idle: 'bg-muted text-muted-foreground',
    loading: 'bg-yellow-500/20 text-yellow-400',
    success: 'bg-green-500/20 text-green-400',
    error: 'bg-red-500/20 text-red-400',
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-dashed border-orange-500/50 bg-orange-500/5">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="py-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-2 text-orange-400">
                <Activity className="h-4 w-4" />
                Live Diagnostics Panel
              </span>
              <div className="flex items-center gap-2">
                <Badge className={statusColor[diagnostics.status]}>
                  {diagnostics.status.toUpperCase()}
                </Badge>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-background/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Clock className="h-3 w-3" />
                  Latency
                </div>
                <div className="text-lg font-mono">
                  {diagnostics.latencyMs !== null ? `${diagnostics.latencyMs}ms` : '--'}
                </div>
              </div>
              
              <div className="bg-background/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Database className="h-3 w-3" />
                  Payload Size
                </div>
                <div className="text-lg font-mono">
                  {diagnostics.payloadSize !== null 
                    ? `${(diagnostics.payloadSize / 1024).toFixed(1)}KB` 
                    : '--'}
                </div>
              </div>
              
              <div className="bg-background/50 rounded-lg p-3">
                <div className="text-muted-foreground text-xs mb-1">Strikes</div>
                <div className={`text-lg font-mono ${diagnostics.strikesCount === 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {diagnostics.strikesCount}
                </div>
              </div>
              
              <div className="bg-background/50 rounded-lg p-3">
                <div className="text-muted-foreground text-xs mb-1">Spot Price</div>
                <div className="text-lg font-mono">
                  {diagnostics.spotPrice ?? '--'}
                </div>
              </div>
            </div>

            {/* Last Request Time */}
            <div className="text-xs text-muted-foreground">
              Last request: {diagnostics.lastRequestTime || 'Never'}
            </div>

            {/* Error Message */}
            {diagnostics.errorMessage && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 rounded-lg text-red-400 text-sm">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{diagnostics.errorMessage}</span>
              </div>
            )}

            {/* Raw Response Debug */}
            {diagnostics.rawResponse && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  View Raw Response
                </summary>
                <pre className="mt-2 p-3 bg-background rounded-lg overflow-auto max-h-48 text-[10px]">
                  {JSON.stringify(diagnostics.rawResponse, null, 2)}
                </pre>
              </details>
            )}

            {/* Debug Info */}
            <div className="text-xs text-muted-foreground space-y-1">
              <div>HTTP Status: {diagnostics.httpStatus ?? '--'}</div>
              <div>Expiry Dates Available: {diagnostics.expiryDatesCount}</div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
