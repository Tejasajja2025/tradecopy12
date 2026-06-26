type MemorySignal = {
  id: string;
  source: 'memory';
  currencyPair: string;
  direction: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  action: string;
  status: string;
  createdAt: string;
  followerCount: number;
};

const memorySignals: MemorySignal[] = [];

function createSignalId() {
  return `mem-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createPendingSignal(input: {
  currencyPair: string;
  direction: string;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  lotSize?: number;
  action?: string;
  followerCount?: number;
}) {
  const signal: MemorySignal = {
    id: createSignalId(),
    source: 'memory',
    currencyPair: input.currencyPair,
    direction: input.direction.toUpperCase(),
    entryPrice: Number(input.entryPrice || 0),
    stopLoss: Number(input.stopLoss || 0),
    takeProfit: Number(input.takeProfit || 0),
    lotSize: Number(input.lotSize || 0.01),
    action: (input.action || 'OPEN').toUpperCase(),
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    followerCount: Number(input.followerCount || 0),
  };

  memorySignals.push(signal);
  return signal;
}

export function createPendingCloseSignal(input: { currencyPair: string; direction?: string; followerCount?: number }) {
  const signal = createPendingSignal({
    currencyPair: input.currencyPair,
    direction: input.direction || 'BUY',
    action: 'CLOSE',
    followerCount: input.followerCount,
  });
  signal.status = 'PENDING_CLOSE';
  return signal;
}

export function listPendingSignals() {
  return memorySignals
    .filter((signal) => signal.status === 'PENDING' || signal.status === 'PENDING_CLOSE')
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function markSignalExecuted(signalId: string) {
  const signal = memorySignals.find((item) => item.id === String(signalId));
  if (signal) {
    signal.status = 'EXECUTED';
  }
  return Boolean(signal);
}

export function setSignalFollowerCount(signalId: string, followerCount: number) {
  const signal = memorySignals.find((item) => item.id === String(signalId));
  if (signal) {
    signal.followerCount = followerCount;
  }
}
