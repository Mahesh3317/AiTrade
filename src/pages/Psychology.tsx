import { useState } from 'react';
import { Brain, Smile, Meh, Frown, AlertTriangle, CheckCircle2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { mockPsychologyEntries } from '@/data/mockData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';

const emotionIcons = {
  1: Frown,
  2: Frown,
  3: Meh,
  4: Smile,
  5: Smile,
};

const emotionLabels = {
  1: 'Very Low',
  2: 'Low',
  3: 'Neutral',
  4: 'Good',
  5: 'Excellent',
};

const biasOptions = [
  'FOMO',
  'Loss Aversion',
  'Anchoring',
  'Overconfidence',
  'Revenge Trading',
  'Analysis Paralysis',
  'Confirmation Bias',
];

export default function Psychology() {
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [mood, setMood] = useState([3]);
  const [confidence, setConfidence] = useState([70]);
  const [selectedBiases, setSelectedBiases] = useState<string[]>([]);

  const toggleBias = (bias: string) => {
    setSelectedBiases((prev) =>
      prev.includes(bias) ? prev.filter((b) => b !== bias) : [...prev, bias]
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Psychology Tracker</h1>
          <p className="text-muted-foreground">Track your emotions and mental state</p>
        </div>
        <Dialog open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Log Psychology Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label>Pre-Market Mood</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={mood}
                    onValueChange={setMood}
                    max={5}
                    min={1}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-20">
                    {emotionLabels[mood[0] as keyof typeof emotionLabels]}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Confidence Level</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={confidence}
                    onValueChange={setConfidence}
                    max={100}
                    min={0}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-12">{confidence[0]}%</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Potential Biases</Label>
                <div className="flex flex-wrap gap-2">
                  {biasOptions.map((bias) => (
                    <button
                      key={bias}
                      onClick={() => toggleBias(bias)}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                        selectedBiases.includes(bias)
                          ? 'bg-warning/20 text-warning border border-warning/30'
                          : 'bg-muted text-muted-foreground hover:bg-accent'
                      )}
                    >
                      {bias}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Pre-Market Notes</Label>
                <Textarea placeholder="How are you feeling? What's your market outlook?" />
              </div>

              <Button className="w-full">Save Entry</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Brain className="h-4 w-4" />
            <span className="text-xs font-medium">Avg Mood Score</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">3.8/5</p>
          <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">Rule Adherence</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-profit">78%</p>
          <p className="text-xs text-muted-foreground mt-1">Trades following plan</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">Bias Triggers</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-warning">4</p>
          <p className="text-xs text-muted-foreground mt-1">This week</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Smile className="h-4 w-4" />
            <span className="text-xs font-medium">Best Mood Day</span>
          </div>
          <p className="mt-2 text-lg font-bold text-foreground">Friday</p>
          <p className="text-xs text-profit mt-1">+₹15,800 avg P&L</p>
        </div>
      </div>

      {/* Emotion-Performance Correlation */}
      <div className="stat-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">Emotion-Performance Link</h3>
        <div className="grid gap-4 md:grid-cols-5">
          {[1, 2, 3, 4, 5].map((level) => {
            const Icon = emotionIcons[level as keyof typeof emotionIcons];
            const avgPnl = level >= 3 ? (level * 2000 + Math.random() * 3000) : -(5 - level) * 1500;
            const trades = Math.floor(Math.random() * 15) + 5;
            
            return (
              <div key={level} className="rounded-lg bg-muted/30 p-4 text-center">
                <Icon className={cn(
                  "h-8 w-8 mx-auto mb-2",
                  level >= 4 ? 'text-profit' : level <= 2 ? 'text-loss' : 'text-muted-foreground'
                )} />
                <p className="text-xs text-muted-foreground mb-1">{emotionLabels[level as keyof typeof emotionLabels]}</p>
                <p className={cn(
                  "text-lg font-bold font-mono",
                  avgPnl >= 0 ? 'text-profit' : 'text-loss'
                )}>
                  {avgPnl >= 0 ? '+' : ''}₹{Math.round(avgPnl).toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-muted-foreground">{trades} trades</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Entries */}
      <div className="stat-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Entries</h3>
        <div className="space-y-4">
          {mockPsychologyEntries.map((entry) => {
            const Icon = emotionIcons[entry.preMarketMood];
            return (
              <div key={entry.id} className="rounded-lg bg-muted/30 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      entry.preMarketMood >= 4 ? 'bg-profit/10' : entry.preMarketMood <= 2 ? 'bg-loss/10' : 'bg-muted'
                    )}>
                      <Icon className={cn(
                        "h-5 w-5",
                        entry.preMarketMood >= 4 ? 'text-profit' : entry.preMarketMood <= 2 ? 'text-loss' : 'text-muted-foreground'
                      )} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {new Date(entry.date).toLocaleDateString('en-IN', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Mood: {emotionLabels[entry.preMarketMood]} • Confidence: {entry.confidence}%
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                    entry.marketBias === 'BULLISH' ? 'bg-profit/10 text-profit' :
                    entry.marketBias === 'BEARISH' ? 'bg-loss/10 text-loss' : 'bg-muted text-muted-foreground'
                  )}>
                    {entry.marketBias}
                  </span>
                </div>
                <p className="text-sm text-foreground mb-2">{entry.notes}</p>
                {entry.biases.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {entry.biases.map((bias) => (
                      <span key={bias} className="rounded-full bg-warning/10 px-2 py-0.5 text-xs text-warning">
                        {bias}
                      </span>
                    ))}
                  </div>
                )}
                {entry.lessonsLearned && (
                  <div className="mt-3 rounded-lg bg-chart-2/5 p-2 border border-chart-2/20">
                    <p className="text-xs text-chart-2 font-medium">Lesson Learned</p>
                    <p className="text-sm text-foreground">{entry.lessonsLearned}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
