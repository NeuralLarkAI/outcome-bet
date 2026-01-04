import { useState, useCallback } from 'react';
import { Market, Position, MarketSide, WalletState } from '@/types/market';

// Mock initial market data
const initialMarket: Market = {
  id: '1',
  question: 'Will BTC be above $75,000 on Friday at 12:00 UTC?',
  targetPrice: 75000,
  targetAsset: 'BTC',
  settlementDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
  yesPool: 1240,
  noPool: 760,
  resolved: false,
  outcome: null,
};

export function useMarket() {
  const [market, setMarket] = useState<Market>(initialMarket);
  const [positions, setPositions] = useState<Position[]>([]);
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: null,
    balance: 10.5,
  });

  const yesPercentage = Math.round((market.yesPool / (market.yesPool + market.noPool)) * 100);
  const noPercentage = 100 - yesPercentage;

  const connectWallet = useCallback(async () => {
    // Mock wallet connection
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
    
    // Simplified payout: if you're right, you get proportional share of losing pool
    const shareOfWinningPool = amount / (pool + amount);
    const potentialWinnings = shareOfWinningPool * (oppositePool + amount);
    
    // Apply 1% fee to winnings
    const fee = potentialWinnings * 0.01;
    return Math.round((potentialWinnings - fee) * 100) / 100;
  }, [market]);

  const takeSide = useCallback((side: MarketSide, amount: number) => {
    if (!wallet.connected || amount <= 0 || amount > wallet.balance) return;

    const newPosition: Position = {
      id: Date.now().toString(),
      side,
      amount,
      potentialPayout: calculatePayout(side, amount),
      status: 'active',
      createdAt: new Date(),
    };

    setPositions(prev => [...prev, newPosition]);
    setWallet(prev => ({ ...prev, balance: prev.balance - amount }));
    
    // Update pool
    setMarket(prev => ({
      ...prev,
      yesPool: side === 'YES' ? prev.yesPool + amount : prev.yesPool,
      noPool: side === 'NO' ? prev.noPool + amount : prev.noPool,
    }));
  }, [wallet, calculatePayout]);

  const closePosition = useCallback((positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    if (!position || position.status !== 'active') return;

    // Return 95% of original amount (5% early exit fee)
    const refund = position.amount * 0.95;
    
    setPositions(prev => prev.filter(p => p.id !== positionId));
    setWallet(prev => ({ ...prev, balance: prev.balance + refund }));
    
    // Update pool
    setMarket(prev => ({
      ...prev,
      yesPool: position.side === 'YES' ? prev.yesPool - position.amount : prev.yesPool,
      noPool: position.side === 'NO' ? prev.noPool - position.amount : prev.noPool,
    }));
  }, [positions]);

  const resolveMarket = useCallback((outcome: MarketSide) => {
    setMarket(prev => ({ ...prev, resolved: true, outcome }));
    
    setPositions(prev => prev.map(position => {
      if (position.status !== 'active') return position;
      
      const won = position.side === outcome;
      return {
        ...position,
        status: won ? 'won' : 'lost',
      };
    }));

    // Credit winning positions
    positions.forEach(position => {
      if (position.side === outcome && position.status === 'active') {
        setWallet(prev => ({ ...prev, balance: prev.balance + position.potentialPayout }));
      }
    });
  }, [positions]);

  return {
    market,
    positions,
    wallet,
    yesPercentage,
    noPercentage,
    connectWallet,
    disconnectWallet,
    takeSide,
    closePosition,
    resolveMarket,
    calculatePayout,
  };
}
