// Forex data service - real exchange rate provider fallback
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY?.trim();
const ALPHA_VANTAGE_URL = 'https://www.alphavantage.co/query';
const EXCHANGE_RATE_HOST_URL = 'https://api.exchangerate.host';
const COINGECKO_URL = 'https://api.coingecko.com/api/v3';

export interface ForexRate {
  pair: string;
  bid: number;
  ask: number;
  mid: number;
  timestamp: string;
}

export interface ForexTimeSeries {
  pair: string;
  data: Array<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
  }>;
}

// Popular forex pairs
export const MAJOR_FOREX_PAIRS = [
  'EURUSD',
  'GBPUSD',
  'USDJPY',
  'USDCHF',
  'AUDUSD',
  'USDCAD',
  'NZDUSD',
  'EURGBP',
  'EURJPY',
  'GBPJPY',
];

// Cache for rates (in-memory, 60 second TTL)
const rateCache = new Map<
  string,
  { data: ForexRate; timestamp: number }
>();

async function fetchExchangeRateHost(
  fromCurrency: string,
  toCurrency: string
): Promise<ForexRate | null> {
  try {
    const url = new URL(`${EXCHANGE_RATE_HOST_URL}/convert`);
    url.searchParams.append('from', fromCurrency);
    url.searchParams.append('to', toCurrency);
    url.searchParams.append('places', '6');

    const response = await fetch(url.toString());
    const json = await response.json();
    if (!json || typeof json.result !== 'number') {
      console.warn('ExchangeRate.host returned invalid data for', `${fromCurrency}${toCurrency}`);
      return null;
    }

    const rate = Number(json.result);
    return {
      pair: `${fromCurrency}${toCurrency}`,
      bid: rate,
      ask: rate,
      mid: rate,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('ExchangeRate.host fetch failed:', error);
    return null;
  }
}

async function fetchCoinGeckoRate(
  fromCurrency: string,
  toCurrency: string
): Promise<ForexRate | null> {
  const normalized = fromCurrency.toLowerCase();
  const toLower = toCurrency.toLowerCase();
  const cryptoMap: Record<string, string> = {
    btc: 'bitcoin',
    eth: 'ethereum',
  };

  if (!(normalized in cryptoMap) && !(toLower in cryptoMap)) {
    return null;
  }

  try {
    if (cryptoMap[normalized] && toLower === 'usd') {
      const url = new URL(`${COINGECKO_URL}/simple/price`);
      url.searchParams.append('ids', cryptoMap[normalized]);
      url.searchParams.append('vs_currencies', 'usd');

      const response = await fetch(url.toString());
      const json = await response.json();
      const price = Number(json[cryptoMap[normalized]]?.usd ?? 0);
      if (!price) return null;
      return {
        pair: `${fromCurrency}${toCurrency}`,
        bid: price,
        ask: price,
        mid: price,
        timestamp: new Date().toISOString(),
      };
    }

    if (cryptoMap[toLower] && normalized === 'usd') {
      const url = new URL(`${COINGECKO_URL}/simple/price`);
      url.searchParams.append('ids', cryptoMap[toLower]);
      url.searchParams.append('vs_currencies', 'usd');

      const response = await fetch(url.toString());
      const json = await response.json();
      const price = Number(json[cryptoMap[toLower]]?.usd ?? 0);
      if (!price) return null;
      const inverted = 1 / price;
      return {
        pair: `${fromCurrency}${toCurrency}`,
        bid: inverted,
        ask: inverted,
        mid: inverted,
        timestamp: new Date().toISOString(),
      };
    }

    return null;
  } catch (error) {
    console.error('CoinGecko fetch failed:', error);
    return null;
  }
}

export async function getForexRate(
  fromCurrency: string,
  toCurrency: string
): Promise<ForexRate | null> {
  const pair = `${fromCurrency}${toCurrency}`;
  const cacheKey = pair;

  const cached = rateCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 60000) {
    return cached.data;
  }

  const normalizedFrom = fromCurrency.toUpperCase();
  const normalizedTo = toCurrency.toUpperCase();
  let rate: ForexRate | null = null;

  if (['BTC', 'ETH'].includes(normalizedFrom) || ['BTC', 'ETH'].includes(normalizedTo)) {
    rate = await fetchCoinGeckoRate(normalizedFrom, normalizedTo);
  }

  if (!rate && API_KEY) {
    try {
      const url = new URL(ALPHA_VANTAGE_URL);
      url.searchParams.append('function', 'CURRENCY_EXCHANGE_RATE');
      url.searchParams.append('from_currency', normalizedFrom);
      url.searchParams.append('to_currency', normalizedTo);
      url.searchParams.append('apikey', API_KEY);

      const response = await fetch(url.toString());
      const json = await response.json();
      if (json['Realtime Currency Exchange Rate']) {
        const rateData = json['Realtime Currency Exchange Rate'];
        const bid = parseFloat(rateData['Bid Price'] || 0);
        const ask = parseFloat(rateData['Ask Price'] || 0);
        if (bid > 0 && ask > 0) {
          rate = {
            pair,
            bid,
            ask,
            mid: (bid + ask) / 2,
            timestamp: new Date().toISOString(),
          };
        }
      }
    } catch (error) {
      console.error('Alpha Vantage fetch failed:', error);
    }
  }

  if (!rate) {
    rate = await fetchExchangeRateHost(normalizedFrom, normalizedTo);
  }

  if (rate) {
    rateCache.set(cacheKey, { data: rate, timestamp: Date.now() });
  }

  return rate;
}

const TIME_SERIES_BASELINES: Record<string, number> = {
  EURUSD: 1.0850,
  GBPUSD: 1.2720,
  USDJPY: 148.55,
  AUDUSD: 0.6650,
  USDCAD: 1.3700,
  USDCHF: 0.9140,
  NZDUSD: 0.6050,
  EURGBP: 0.8520,
  EURJPY: 161.70,
  GBPJPY: 188.35,
  XAUUSD: 2075.0,
  XAGUSD: 24.8,
  BTCUSD: 68000.0,
  ETHUSD: 3600.0,
};

function createDeterministicRng(seed: number) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function generateSyntheticTimeSeries(
  pair: string,
  interval: 'intraday' | 'daily'
): ForexTimeSeries {
  const baseline = TIME_SERIES_BASELINES[pair] ?? 1.0;
  const points = interval === 'intraday' ? 24 : 30;
  let seed = pair
    .split('')
    .reduce((acc, char) => acc * 31 + char.charCodeAt(0), 1);
  const rng = createDeterministicRng(seed);
  const values = Array.from({ length: points }, (_, index) => {
    const drift = (index / points) * 0.01;
    const noise = (rng() - 0.5) * 0.006;
    const open = baseline * (1 + drift * 0.2 + noise);
    const close = open * (1 + (rng() - 0.5) * 0.003);
    const high = Math.max(open, close) * (1 + rng() * 0.0025);
    const low = Math.min(open, close) * (1 - rng() * 0.0025);
    const timestamp = interval === 'intraday'
      ? `${24 - index}:00`
      : new Date(Date.now() - (points - index - 1) * 86400000).toISOString().slice(0, 10);

    return {
      time: timestamp,
      open: Number(open.toFixed(5)),
      high: Number(high.toFixed(5)),
      low: Number(low.toFixed(5)),
      close: Number(close.toFixed(5)),
    };
  });

  return {
    pair,
    data: values,
  };
}

async function fetchExchangeRateHostTimeSeries(
  pair: string,
  interval: 'intraday' | 'daily'
): Promise<ForexTimeSeries | null> {
  const fromCurrency = pair.substring(0, 3);
  const toCurrency = pair.substring(3, 6);
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 29);

  try {
    const start = startDate.toISOString().slice(0, 10);
    const end = endDate.toISOString().slice(0, 10);
    const url = new URL(`${EXCHANGE_RATE_HOST_URL}/timeseries`);
    url.searchParams.append('start_date', start);
    url.searchParams.append('end_date', end);
    url.searchParams.append('base', fromCurrency);
    url.searchParams.append('symbols', toCurrency);

    const response = await fetch(url.toString());
    const json = await response.json();
    if (!json || json.success === false || !json.rates) {
      console.warn('ExchangeRate.host timeseries failed', json);
      return null;
    }

    const data = Object.entries(json.rates)
      .map(([time, value]: [string, any]) => ({
        time,
        open: Number(value[toCurrency].toFixed(6)),
        high: Number(value[toCurrency].toFixed(6)),
        low: Number(value[toCurrency].toFixed(6)),
        close: Number(value[toCurrency].toFixed(6)),
      }))
      .sort((a, b) => a.time.localeCompare(b.time));

    return { pair, data };
  } catch (error) {
    console.error('ExchangeRate.host timeseries error:', error);
    return null;
  }
}

export async function getForexTimeSeries(
  pair: string,
  interval: 'intraday' | 'daily' = 'intraday'
): Promise<ForexTimeSeries> {
  const fromCurrency = pair.substring(0, 3);
  const toCurrency = pair.substring(3, 6);

  if (interval === 'daily') {
    const daily = await fetchExchangeRateHostTimeSeries(pair, interval);
    if (daily) {
      return daily;
    }
  }

  try {
    const timeInterval = interval === 'intraday' ? '15min' : 'daily';
    const functionName =
      interval === 'intraday' ? 'FX_INTRADAY' : 'FX_DAILY';

    const url = new URL(ALPHA_VANTAGE_URL);
    url.searchParams.append('function', functionName);
    url.searchParams.append('from_symbol', fromCurrency);
    url.searchParams.append('to_symbol', toCurrency);
    if (interval === 'intraday') {
      url.searchParams.append('interval', timeInterval);
    }
    if (API_KEY) {
      url.searchParams.append('apikey', API_KEY);
    }

    const response = await fetch(url.toString());
    const json = await response.json();

    if (json['Error Message'] || json['Note']) {
      console.error('Alpha Vantage time series error:', json['Error Message'] || json['Note']);
      return generateSyntheticTimeSeries(pair, interval);
    }

    const timeSeriesKey = Object.keys(json).find((key) =>
      key.includes('Time Series')
    );
    if (!timeSeriesKey) {
      console.warn('No time series data for', pair);
      return generateSyntheticTimeSeries(pair, interval);
    }

    const timeSeries = json[timeSeriesKey];
    const data = Object.entries(timeSeries)
      .slice(0, 100)
      .map(([time, values]: [string, any]) => ({
        time,
        open: parseFloat(values['1. open'] || 0),
        high: parseFloat(values['2. high'] || 0),
        low: parseFloat(values['3. low'] || 0),
        close: parseFloat(values['4. close'] || 0),
      }))
      .reverse();

    return {
      pair,
      data,
    };
  } catch (error) {
    console.error('Failed to fetch forex time series:', error);
    return generateSyntheticTimeSeries(pair, interval);
  }
}

export async function getAllForexRates(): Promise<ForexRate[]> {
  const ratePromises = MAJOR_FOREX_PAIRS.map(async (pair) => {
    const from = pair.substring(0, 3);
    const to = pair.substring(3, 6);
    return getForexRate(from, to);
  });

  const resolved = await Promise.all(ratePromises);
  return resolved.filter((rate): rate is ForexRate => rate !== null);
}
