import { Wallet } from 'lucide-react';
import { WalletState } from '@/types/market';

interface HeaderProps {
  wallet: WalletState;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function Header({ wallet, onConnect, onDisconnect }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">Y</span>
          </div>
          <span className="text-xl font-bold text-foreground">YesNo</span>
        </div>

        {wallet.connected ? (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm text-muted-foreground">Balance</span>
              <span className="font-semibold text-foreground">{wallet.balance.toFixed(2)} SOL</span>
            </div>
            <button
              onClick={onDisconnect}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 
                         transition-colors duration-200"
            >
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{wallet.address}</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onConnect}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground
                       font-medium transition-all duration-200 hover:scale-[1.02] hover:shadow-lg
                       hover:shadow-primary/20"
          >
            <Wallet className="w-4 h-4" />
            <span>Connect Wallet</span>
          </button>
        )}
      </div>
    </header>
  );
}
