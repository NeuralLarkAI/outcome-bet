import { useState, useCallback, useMemo } from 'react';
import { Market, Position, MarketSide, WalletState, EventAsset } from '@/types/market';

// Market configurations for each asset
const marketConfigs: Record<EventAsset, { targetPrice: number; question: string }> = {
  BTC: { targetPrice: 75000, question: 'Will BTC be above $75,000 on Friday at 12:00 UTC?' },
  ETH: { targetPrice: 4000, question: 'Will ETH be above $4,000 on Friday at 12:00 UTC?' },
  SHIB: { targetPrice: 0.00003, question: 'Will SHIB be above $0.00003 on Friday at 12:00 UTC?' },
  DOGE: { targetPrice: 0.15, question: 'Will DOGE be above $0.15 on Friday at 12:00 UTC?' },
};

// Create initial markets for each asset
const createInitialMarkets = (): Record<EventAsset, Market> => {
  const settlementDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
  
  return {
    BTC: {
      id: 'btc-1',
      question: marketConfigs.BTC.question,
      targetPrice: marketConfigs.BTC.targetPrice,
      targetAsset: 'BTC',
      settlementDate,
      yesPool: 1240,
      noPool: 760,
      resolved: false,
      outcome: null,
    },
    ETH: {
      id: 'eth-1',
      question: marketConfigs.ETH.question,
      targetPrice: marketConfigs.ETH.targetPrice,
      targetAsset: 'ETH',
      settlementDate,
      yesPool: 890,
      noPool: 1110,
      resolved: false,
      outcome: null,
    },
    SHIB: {
      id: 'shib-1',
      question: marketConfigs.SHIB.question,
      targetPrice: marketConfigs.SHIB.targetPrice,
      targetAsset: 'SHIB',
      settlementDate,
      yesPool: 450,
      noPool: 550,
      resolved: false,
      outcome: null,
    },
    DOGE: {
      id: 'doge-1',
      question: marketConfigs.DOGE.question,
      targetPrice: marketConfigs.DOGE.targetPrice,
      targetAsset: 'DOGE',
      settlementDate,
      yesPool: 680,
      noPool: 520,
      resolved: false,
      outcome: null,
    },
  };
};

export function useMarket() {
  const [markets, setMarkets] = useState<Record<EventAsset, Market>>(createInitialMarkets);
  const [selectedAsset, setSelectedAsset] = useState<EventAsset>('BTC');
  const [positions, setPositions] = useState<Position[]>([]);
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: null,
    balance: 10.5,
  });

  const market = markets[selectedAsset];
  const yesPercentage = Math.round((market.yesPool / (market.yesPool + market.noPool)) * 100);
  const noPercentage = 100 - yesPercentage;

  // Calculate payout per 1 SOL for display
  const payoutPerSol = useMemo(() => {
    const totalPool = market.yesPool + market.noPool;
    const yesReturn = totalPool / market.yesPool;
    const noReturn = totalPool / market.noPool;
    return {
      yes: Math.round(yesReturn * 0.99 * 100) / 100, // 1% fee
      no: Math.round(noReturn * 0.99 * 100) / 100,
    };
  }, [market]);

  const connectWallet = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setWallet({
      connected: true,
      address: '7xKX...4nPq',
      balance: 10.5,
    });
  }, []);

  const disconnectWallet = useCallback(() => {
    setWallet({
      connected: false,
      address: null,
      balance: 0,
    });
    setPositions([]);
  }, []);

  const calculatePayout = useCallback((side: MarketSide, amount: number): number => {
    const pool = side === 'YES' ? market.yesPool : market.noPool;
    const totalPool = market.yesPool + market.noPool;
    const oppositePool = totalPool - pool;
    
    const shareOfWinningPool = amount / (pool + amount);
    const potentialWinnings = shareOfWinningPool * (oppositePool + amount);
    
    const fee = potentialWinnings * 0.01;
    return Math.round((potentialWinnings - fee) * 100) / 100;
  }, [market]);

  const takeSide = useCallback((side: MarketSide, amount: number) => {
    if (!wallet.connected || amount <= 0 || amount > wallet.balance) return;

    const newPosition: Position = {
      id: Date.now().toString(),
      marketId: market.id,
      side,
      amount,
      potentialPayout: calculatePayout(side, amount),
      status: 'active',
      createdAt: new Date(),
    };

    setPositions(prev => [...prev, newPosition]);
    setWallet(prev => ({ ...prev, balance: prev.balance - amount }));
    
    setMarkets(prev => ({
      ...prev,
      [selectedAsset]: {
        ...prev[selectedAsset],
        yesPool: side === 'YES' ? prev[selectedAsset].yesPool + amount : prev[selectedAsset].yesPool,
        noPool: side === 'NO' ? prev[selectedAsset].noPool + amount : prev[selectedAsset].noPool,
      },
    }));
  }, [wallet, market, selectedAsset, calculatePayout]);

  const closePosition = useCallback((positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    if (!position || position.status !== 'active') return;

    const refund = position.amount * 0.95;
    
    setPositions(prev => prev.filter(p => p.id !== positionId));
    setWallet(prev => ({ ...prev, balance: prev.balance + refund }));
    
    // Find which market this position belongs to
    const positionMarket = Object.values(markets).find(m => m.id === position.marketId);
    if (positionMarket) {
      setMarkets(prev => ({
        ...prev,
        [positionMarket.targetAsset]: {
          ...prev[positionMarket.targetAsset],
          yesPool: position.side === 'YES' ? prev[positionMarket.targetAsset].yesPool - position.amount : prev[positionMarket.targetAsset].yesPool,
          noPool: position.side === 'NO' ? prev[positionMarket.targetAsset].noPool - position.amount : prev[positionMarket.targetAsset].noPool,
        },
      }));
    }
  }, [positions, markets]);

  const resolveMarket = useCallback((outcome: MarketSide) => {
    setMarkets(prev => ({
      ...prev,
      [selectedAsset]: { ...prev[selectedAsset], resolved: true, outcome },
    }));
    
    setPositions(prev => prev.map(position => {
      if (position.marketId !== market.id || position.status !== 'active') return position;
      
      const won = position.side === outcome;
      return {
        ...position,
        status: won ? 'won' : 'lost',
      };
    }));

    positions.forEach(position => {
      if (position.marketId === market.id && position.side === outcome && position.status === 'active') {
        setWallet(prev => ({ ...prev, balance: prev.balance + position.potentialPayout }));
      }
    });
  }, [market, selectedAsset, positions]);

  // Filter positions for current market
  const currentMarketPositions = positions.filter(p => p.marketId === market.id);

  return {
    market,
    markets,
    selectedAsset,
    setSelectedAsset,
    positions: currentMarketPositions,
    allPositions: positions,
    wallet,
    yesPercentage,
    noPercentage,
    payoutPerSol,
    connectWallet,
    disconnectWallet,
    takeSide,
    closePosition,
    resolveMarket,
    calculatePayout,
  };
}
