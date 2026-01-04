export type MarketSide = 'YES' | 'NO';

export type PositionStatus = 'active' | 'won' | 'lost';

export type EventAsset = 'BTC' | 'ETH' | 'SHIB' | 'DOGE';

export interface Market {
  id: string;
  question: string;
  targetPrice: number;
  targetAsset: EventAsset;
  settlementDate: Date;
  yesPool: number;
  noPool: number;
  resolved: boolean;
  outcome: MarketSide | null;
}

export interface Position {
  id: string;
  marketId: string;
  side: MarketSide;
  amount: number;
  potentialPayout: number;
  status: PositionStatus;
  createdAt: Date;
}

export interface WalletState {
  connected: boolean;
  address: string | null;
  balance: number;
}
