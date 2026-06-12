'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface ForexRate {
  pair: string;
  bid: number;
  ask: number;
  mid: number;
  timestamp: string;
}

interface ChartDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export function ForexRatesPanel() {
  const [rates, setRates] = useState<ForexRate[]>([]);
  const [selectedPair, setSelectedPair] = useState<string>('EURUSD');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interval, setInterval] = useState<'intraday' | 'daily'>('intraday');

  // Fetch all rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/forex');
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`Rates fetch failed: ${res.status} ${res.statusText} - ${body.slice(0, 200)}`);
        }
        const data = await res.json();

        if (data.success && data.rates) {
          setRates(data.rates);
          setError(null);
        } else {
          setError(data.error || 'Failed to fetch rates');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching rates');
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
    // Refresh every 60 seconds
    const timerId = window.setInterval(fetchRates, 60000);
    return () => clearInterval(timerId);
  }, []);

  // Fetch chart data for selected pair
  useEffect(() => {
    const fetchChart = async () => {
      try {
        const res = await fetch(
          `/api/forex/chart?pair=${selectedPair}&interval=${interval}`
        );
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`Chart fetch failed: ${res.status} ${res.statusText} - ${body.slice(0, 200)}`);
        }
        const data = await res.json();

        if (data.success && data.timeSeries?.data) {
          setChartData(data.timeSeries.data);
          setError(null);
        } else {
          setChartData([]);
          setError(data.error || 'Failed to fetch chart data');
        }
      } catch (err) {
        console.error('Error fetching chart:', err);
        setChartData([]);
        setError(err instanceof Error ? err.message : 'Error fetching chart');
      }
    };

    if (selectedPair) {
      fetchChart();
    }
  }, [selectedPair, interval]);

  const selectedRate = rates.find((r) => r.pair === selectedPair);
  const prevRate = rates.find((r) => r.pair === selectedPair);
  const change = selectedRate ? selectedRate.bid - (prevRate?.bid || selectedRate.bid) : 0;
  const changePercent = selectedRate && prevRate ? ((change / prevRate.bid) * 100).toFixed(2) : '0.00';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Forex Rates</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-950/20 p-4 text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-slate-800" />
          ))}
        </div>
      ) : (
        <>
          {/* Rates Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {rates.map((rate) => (
              <Card
                key={rate.pair}
                className={`cursor-pointer border transition-all ${
                  selectedPair === rate.pair
                    ? 'border-primary bg-primary/10'
                    : 'border-white/10 hover:border-primary/50'
                }`}
                onClick={() => setSelectedPair(rate.pair)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {rate.pair}
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {rate.mid.toFixed(5)}
                      </p>
                    </div>
                    <Badge
                      variant={change >= 0 ? 'default' : 'destructive'}
                      className="gap-1"
                    >
                      {change >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {changePercent}%
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Bid: {rate.bid.toFixed(5)} | Ask: {rate.ask.toFixed(5)}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Chart Section */}
          {selectedRate && (
            <Card className="border-white/10 bg-card/50 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {selectedPair} Chart
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {interval === 'intraday' ? '15-minute' : 'Daily'} data
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={interval === 'intraday' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setInterval('intraday')}
                  >
                    1H
                  </Button>
                  <Button
                    variant={interval === 'daily' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setInterval('daily')}
                  >
                    Daily
                  </Button>
                </div>
              </div>

              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="time"
                      stroke="rgba(255,255,255,0.5)"
                      style={{ fontSize: '12px' }}
                      tick={{ fill: 'rgba(255,255,255,0.5)' }}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.5)"
                      style={{ fontSize: '12px' }}
                      tick={{ fill: 'rgba(255,255,255,0.5)' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                      }}
                      formatter={(value) =>
                        typeof value === 'number' ? value.toFixed(5) : value
                      }
                    />
                    <Legend wrapperStyle={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                    <Area
                      type="monotone"
                      dataKey="close"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorClose)"
                      name="Close Price"
                    />
                    <Line
                      type="monotone"
                      dataKey="high"
                      stroke="hsl(var(--accent))"
                      strokeWidth={1}
                      dot={false}
                      name="High"
                    />
                    <Line
                      type="monotone"
                      dataKey="low"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={1}
                      dot={false}
                      name="Low"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-80 items-center justify-center text-muted-foreground">
                  No chart data available. Alpha Vantage API free tier is rate-limited.
                </div>
              )}
            </Card>
          )}

          {/* Info Box */}
          <div className="rounded-lg border border-blue-500/20 bg-blue-950/20 p-4 text-sm text-blue-200">
            <p className="font-medium">📊 Live Market Price Data</p>
            <p className="mt-1 text-xs opacity-80">
              Primary provider: ExchangeRate.host. Crypto pairs use CoinGecko. Rates refresh every 60 seconds.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
