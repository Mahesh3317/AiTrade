import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { OptionData } from '@/data/optionChainData';

interface OIChartProps {
  data: OptionData[];
  spotPrice: number;
}

export function OIChart({ data, spotPrice }: OIChartProps) {
  const chartData = data.map((item) => ({
    strike: item.strike,
    callOI: item.callOI / 100000, // Convert to Lakhs
    putOI: item.putOI / 100000,
    callOIChange: item.callOIChange / 1000,
    putOIChange: item.putOIChange / 1000,
  }));

  return (
    <div className="stat-card">
      <h3 className="font-semibold text-foreground mb-4">OI Distribution by Strike</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <XAxis 
              type="number" 
              tickFormatter={(v) => `${Math.abs(v).toFixed(1)}L`}
              tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 10 }}
              axisLine={{ stroke: 'hsl(217, 33%, 17%)' }}
            />
            <YAxis 
              type="category" 
              dataKey="strike" 
              tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 10 }}
              width={60}
              axisLine={{ stroke: 'hsl(217, 33%, 17%)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(222, 47%, 10%)',
                border: '1px solid hsl(217, 33%, 17%)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
              formatter={(value: number, name: string) => [
                `${Math.abs(value).toFixed(2)}L`,
                name === 'callOI' ? 'Call OI' : 'Put OI'
              ]}
            />
            <ReferenceLine 
              y={Math.round(spotPrice / 50) * 50} 
              stroke="hsl(38, 92%, 50%)" 
              strokeWidth={2}
              strokeDasharray="5 5"
            />
            <Bar dataKey="callOI" name="callOI" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`call-${index}`} 
                  fill={entry.strike < spotPrice ? 'hsl(142, 76%, 46%)' : 'hsl(142, 76%, 36%)'}
                  fillOpacity={entry.strike < spotPrice ? 0.9 : 0.5}
                />
              ))}
            </Bar>
            <Bar dataKey="putOI" name="putOI" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`put-${index}`} 
                  fill={entry.strike > spotPrice ? 'hsl(0, 72%, 51%)' : 'hsl(0, 72%, 41%)'}
                  fillOpacity={entry.strike > spotPrice ? 0.9 : 0.5}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-profit" />
          <span className="text-xs text-muted-foreground">Call OI</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-loss" />
          <span className="text-xs text-muted-foreground">Put OI</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 border-t-2 border-dashed border-warning" />
          <span className="text-xs text-muted-foreground">Spot Price</span>
        </div>
      </div>
    </div>
  );
}
