import { useState } from 'react';
import { OptionData } from '@/data/optionChainData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface OptionChainTableProps {
  data: OptionData[];
  spotPrice: number;
}

export function OptionChainTable({ data, spotPrice }: OptionChainTableProps) {
  const [view, setView] = useState<'basic' | 'greeks'>('basic');
  
  const formatNumber = (num: number) => {
    if (num >= 100000) return (num / 100000).toFixed(2) + 'L';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString('en-IN');
  };
  
  const getOIChangeColor = (change: number) => {
    if (change > 0) return 'text-profit';
    if (change < 0) return 'text-loss';
    return 'text-muted-foreground';
  };

  const isITM = (strike: number, isCall: boolean) => {
    return isCall ? strike < spotPrice : strike > spotPrice;
  };

  const isATM = (strike: number) => {
    return Math.abs(strike - spotPrice) <= 25;
  };
  
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Option Chain</h3>
        <Tabs value={view} onValueChange={(v) => setView(v as 'basic' | 'greeks')}>
          <TabsList className="h-8">
            <TabsTrigger value="basic" className="text-xs px-3 h-7">Basic</TabsTrigger>
            <TabsTrigger value="greeks" className="text-xs px-3 h-7">Greeks</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {data.length === 0 ? (
        <div className="rounded-lg border border-border bg-card/40 p-6 text-center">
          <p className="text-sm font-medium text-foreground">No live option chain data</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try Refresh or change Symbol/Expiry.
          </p>
        </div>
      ) : (
        <div className="overflow-auto max-h-[600px]">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow className="border-b border-border/50">
                <TableHead colSpan={view === 'basic' ? 5 : 6} className="text-center text-profit bg-profit/5 border-r border-border/30">
                  CALLS
                </TableHead>
                <TableHead className="text-center bg-accent">STRIKE</TableHead>
                <TableHead colSpan={view === 'basic' ? 5 : 6} className="text-center text-loss bg-loss/5 border-l border-border/30">
                  PUTS
                </TableHead>
              </TableRow>
              <TableRow className="border-b border-border/50">
                {view === 'basic' ? (
                  <>
                    <TableHead className="text-xs text-right">OI</TableHead>
                    <TableHead className="text-xs text-right">Chg</TableHead>
                    <TableHead className="text-xs text-right">Vol</TableHead>
                    <TableHead className="text-xs text-right">IV</TableHead>
                    <TableHead className="text-xs text-right border-r border-border/30">LTP</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="text-xs text-right">Δ</TableHead>
                    <TableHead className="text-xs text-right">Γ</TableHead>
                    <TableHead className="text-xs text-right">Θ</TableHead>
                    <TableHead className="text-xs text-right">V</TableHead>
                    <TableHead className="text-xs text-right">IV</TableHead>
                    <TableHead className="text-xs text-right border-r border-border/30">LTP</TableHead>
                  </>
                )}
                <TableHead className="text-xs text-center font-bold">STRIKE</TableHead>
                {view === 'basic' ? (
                  <>
                    <TableHead className="text-xs text-left border-l border-border/30">LTP</TableHead>
                    <TableHead className="text-xs text-left">IV</TableHead>
                    <TableHead className="text-xs text-left">Vol</TableHead>
                    <TableHead className="text-xs text-left">Chg</TableHead>
                    <TableHead className="text-xs text-left">OI</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="text-xs text-left border-l border-border/30">LTP</TableHead>
                    <TableHead className="text-xs text-left">IV</TableHead>
                    <TableHead className="text-xs text-left">Δ</TableHead>
                    <TableHead className="text-xs text-left">Γ</TableHead>
                    <TableHead className="text-xs text-left">Θ</TableHead>
                    <TableHead className="text-xs text-left">V</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow
                  key={row.strike}
                  className={cn(
                    "hover:bg-accent/30 transition-colors",
                    isATM(row.strike) && "bg-warning/10 border-y border-warning/30",
                    isITM(row.strike, true) && !isATM(row.strike) && "bg-profit/5"
                  )}
                >
                  {view === 'basic' ? (
                    <>
                      <TableCell className="text-xs font-mono text-right py-2">{formatNumber(row.callOI)}</TableCell>
                      <TableCell className={cn("text-xs font-mono text-right py-2", getOIChangeColor(row.callOIChange))}>
                        {row.callOIChange >= 0 ? '+' : ''}{formatNumber(row.callOIChange)}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-right py-2 text-muted-foreground">{formatNumber(row.callVolume)}</TableCell>
                      <TableCell className="text-xs font-mono text-right py-2">{row.callIV}%</TableCell>
                      <TableCell className="text-xs font-mono text-right py-2 font-semibold border-r border-border/30">{row.callLTP.toFixed(2)}</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="text-xs font-mono text-right py-2 text-profit">{row.callDelta.toFixed(2)}</TableCell>
                      <TableCell className="text-xs font-mono text-right py-2">{row.callGamma.toFixed(4)}</TableCell>
                      <TableCell className="text-xs font-mono text-right py-2 text-loss">{row.callTheta.toFixed(2)}</TableCell>
                      <TableCell className="text-xs font-mono text-right py-2">{row.callVega.toFixed(2)}</TableCell>
                      <TableCell className="text-xs font-mono text-right py-2">{row.callIV}%</TableCell>
                      <TableCell className="text-xs font-mono text-right py-2 font-semibold border-r border-border/30">{row.callLTP.toFixed(2)}</TableCell>
                    </>
                  )}

                  <TableCell
                    className={cn(
                      "text-xs font-mono text-center py-2 font-bold",
                      isATM(row.strike) && "text-warning"
                    )}
                  >
                    {row.strike.toLocaleString('en-IN')}
                    {isATM(row.strike) && (
                      <Badge variant="outline" className="ml-1 text-[10px] py-0 px-1 border-warning text-warning">ATM</Badge>
                    )}
                  </TableCell>

                  {view === 'basic' ? (
                    <>
                      <TableCell className="text-xs font-mono text-left py-2 font-semibold border-l border-border/30">{row.putLTP.toFixed(2)}</TableCell>
                      <TableCell className="text-xs font-mono text-left py-2">{row.putIV}%</TableCell>
                      <TableCell className="text-xs font-mono text-left py-2 text-muted-foreground">{formatNumber(row.putVolume)}</TableCell>
                      <TableCell className={cn("text-xs font-mono text-left py-2", getOIChangeColor(row.putOIChange))}>
                        {row.putOIChange >= 0 ? '+' : ''}{formatNumber(row.putOIChange)}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-left py-2">{formatNumber(row.putOI)}</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="text-xs font-mono text-left py-2 font-semibold border-l border-border/30">{row.putLTP.toFixed(2)}</TableCell>
                      <TableCell className="text-xs font-mono text-left py-2">{row.putIV}%</TableCell>
                      <TableCell className="text-xs font-mono text-left py-2 text-loss">{row.putDelta.toFixed(2)}</TableCell>
                      <TableCell className="text-xs font-mono text-left py-2">{row.putGamma.toFixed(4)}</TableCell>
                      <TableCell className="text-xs font-mono text-left py-2 text-loss">{row.putTheta.toFixed(2)}</TableCell>
                      <TableCell className="text-xs font-mono text-left py-2">{row.putVega.toFixed(2)}</TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
