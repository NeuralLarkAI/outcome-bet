import { useState } from 'react';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { Market, MarketSide, WalletState } from '@/types/market';
import { CountdownTimer } from './CountdownTimer';
import { ProbabilityBar } from './ProbabilityBar';

interface MarketCardProps {
  market: Market;
  wallet: WalletState;
  yesPercentage: number;
  noPercentage: number;
  onTakeSide: (side: MarketSide, amount: number) => void;
  calculatePayout: (side: MarketSide, amount: number) => number;
}

export function MarketCard({ 
  market, 
  wallet, 
  yesPercentage, 
  noPercentage, 
  onTakeSide,
  calculatePayout 
}: MarketCardProps) {
  const [selectedSide, setSelectedSide] = useState<MarketSide | null>(null);
  const [amount, setAmount] = useState<string>('');

  const numericAmount = parseFloat(amount) || 0;
  const potentialPayout = selectedSide ? calculatePayout(selectedSide, numericAmount) : 0;
  const isValidAmount = numericAmount > 0 && numericAmount <= wallet.balance;

  const handleSubmit = () => {
    if (selectedSide && isValidAmount) {
      onTakeSide(selectedSide, numericAmount);
      setSelectedSide(null);
      setAmount('');
    }
  };

  if (market.resolved) {
    return (
      <div className="market-card rounded-2xl p-6 sm:p-8 border border-border animate-fade-in">
        <div className="text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4
                          ${market.outcome === 'YES' ? 'bg-yes/20 text-yes' : 'bg-no/20 text-no'}`}>
            <span className="font-semibold">Market Settled</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{market.question}</h2>
          <p className="text-3xl font-bold mt-4" style={{ color: market.outcome === 'YES' ? 'hsl(var(--yes))' : 'hsl(var(--no))' }}>
            Outcome: {market.outcome}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="market-card rounded-2xl p-6 sm:p-8 border border-border animate-fade-in">
      <div className="flex flex-col gap-6">
        {/* Asset Badge */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{market.targetAsset}/USD</span>
          </div>
        </div>

        {/* Question */}
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-center leading-tight">
          {market.question}
        </h1>

        {/* Countdown */}
        <CountdownTimer targetDate={market.settlementDate} />

        {/* Probability Bar */}
        <div className="py-4">
          <ProbabilityBar yesPercentage={yesPercentage} noPercentage={noPercentage} />
        </div>

        {/* Action Buttons */}
        {wallet.connected ? (
          <div className="flex flex-col gap-4">
            <p className="text-center text-muted-foreground text-sm">Pick a side.</p>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedSide('YES')}
                className={`btn-yes text-lg ${selectedSide === 'YES' ? 'ring-2 ring-yes ring-offset-2 ring-offset-background' : ''}`}
              >
                YES
              </button>
              <button
                onClick={() => setSelectedSide('NO')}
                className={`btn-no text-lg ${selectedSide === 'NO' ? 'ring-2 ring-no ring-offset-2 ring-offset-background' : ''}`}
              >
                NO
              </button>
            </div>

            {selectedSide && (
              <div className="animate-scale-in flex flex-col gap-4 pt-2">
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount in SOL"
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground
                               placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary
                               text-lg"
                    min="0"
                    step="0.01"
                    max={wallet.balance}
                  />
                  <button
                    onClick={() => setAmount(wallet.balance.toString())}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary font-medium
                               hover:text-primary/80 transition-colors"
                  >
                    MAX
                  </button>
                </div>

                {numericAmount > 0 && (
                  <div className="text-center text-sm text-muted-foreground animate-fade-in">
                    If you're right, you receive{' '}
                    <span className="font-semibold text-foreground">{potentialPayout.toFixed(2)} SOL</span>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!isValidAmount}
                  className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2
                             transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                             ${selectedSide === 'YES' ? 'btn-yes' : 'btn-no'}`}
                >
                  <span>Confirm {selectedSide}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Connect your wallet to trade</p>
          </div>
        )}

        {/* Pool Info */}
        <div className="flex justify-between text-sm text-muted-foreground pt-2 border-t border-border/50">
          <span>Total Pool: {(market.yesPool + market.noPool).toLocaleString()} SOL</span>
          <span>1% settlement fee</span>
        </div>
      </div>
    </div>
  );
}
