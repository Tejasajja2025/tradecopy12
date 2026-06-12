export type TradeDirection = 'BUY' | 'SELL';

export interface TradeSignal {
  id: string;
  currencyPair: string;
  direction: TradeDirection;
  action: 'OPEN' | 'CLOSE';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  timestamp: string;
  status: 'PENDING' | 'EXECUTED' | 'CLOSED';
}

export interface MasterConnection {
  vantageId: string;
  server: string;
  isConnected: boolean;
  lastHeartbeat: string;
}

export interface FollowerAccount {
  id: string;
  name: string;
  balance: number;
  riskPercentage: number;
  mt5Connected: boolean;
  vantageConnected: boolean;
  lastSync: string;
}

export interface ConnectionStatus {
  service: string;
  status: 'online' | 'offline' | 'warning';
  latencyMs: number;
}
