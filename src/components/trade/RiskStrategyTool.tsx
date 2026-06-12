"use client";

import { useState } from "react";
import { BrainCircuit, Calculator, Info, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { optimizedLotSizeSuggestions, type OptimizedLotSizeSuggestionsOutput } from "@/ai/flows/optimized-lot-size-suggestions";

export function RiskStrategyTool() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<OptimizedLotSizeSuggestionsOutput | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const output = await optimizedLotSizeSuggestions({
        tradeDetails: {
          currencyPair: "XAUUSD",
          direction: "BUY",
          entryPrice: 2024.50,
          stopLossPrice: 2018.00,
          takeProfitPrice: 2045.00,
        },
        marketVolatility: {
          averageTrueRange: 12.5,
          recentPriceSwingPips: 45,
        },
        followers: [
          { id: "F-102", accountBalance: 5000, maxRiskPerTradePercentage: 0.02 },
          { id: "F-441", accountBalance: 12500, maxRiskPerTradePercentage: 0.015 },
          { id: "F-903", accountBalance: 1000, maxRiskPerTradePercentage: 0.05 },
        ]
      });
      setResults(output);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card border-l-4 border-l-accent snappy-transition h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="font-headline text-lg flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-accent" strokeWidth={1.5} />
          Risk Strategy Tool
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={runAnalysis} 
          disabled={loading}
          className="border-accent/30 text-accent hover:bg-accent/10 h-8"
        >
          {loading ? "ANALYZING..." : "RE-CALCULATE"}
          <Sparkles className="ml-2 w-3 h-3" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col pt-0">
        <ScrollArea className="flex-1 pr-4">
          {!results && !loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Calculator className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-headline">Ready for AI risk optimization</p>
            </div>
          ) : loading ? (
            <div className="space-y-4 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded bg-secondary/50 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {results?.lotSizeSuggestions.map((suggestion) => (
                <div key={suggestion.followerId} className="p-4 rounded-lg bg-secondary/20 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Follower {suggestion.followerId}</span>
                    <Badge variant="outline" className="border-accent text-accent font-mono text-lg py-1 px-3">
                      {suggestion.suggestedLotSize.toFixed(2)} LOTS
                    </Badge>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground italic flex gap-2">
                    <Info className="w-3 h-3 shrink-0 mt-0.5 text-primary" />
                    {suggestion.rationale}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}