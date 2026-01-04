import { useState } from 'react';
import { Settings, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { Market, MarketSide } from '@/types/market';

interface AdminPanelProps {
  market: Market;
  onResolve: (outcome: MarketSide) => void;
}

export function AdminPanel({ market, onResolve }: AdminPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (market.resolved) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center
                   hover:bg-secondary/80 transition-colors shadow-lg"
      >
        <Settings className="w-5 h-5 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 w-72 glass rounded-xl p-4 animate-scale-in shadow-xl">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Admin Controls
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-secondary rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <DollarSign className="w-3 h-3" />
                  <span>YES Pool</span>
                </div>
                <p className="font-semibold text-foreground">{market.yesPool.toLocaleString()} SOL</p>
              </div>
              <div className="bg-secondary rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <DollarSign className="w-3 h-3" />
                  <span>NO Pool</span>
                </div>
                <p className="font-semibold text-foreground">{market.noPool.toLocaleString()} SOL</p>
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Resolve Market</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onResolve('YES')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-yes/20 text-yes
                           hover:bg-yes/30 transition-colors text-sm font-medium"
                >
                  <CheckCircle className="w-4 h-4" />
                  YES Wins
                </button>
                <button
                  onClick={() => onResolve('NO')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-no/20 text-no
                           hover:bg-no/30 transition-colors text-sm font-medium"
                >
                  <XCircle className="w-4 h-4" />
                  NO Wins
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
