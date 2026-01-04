import { Header } from '@/components/Header';
import { MarketCard } from '@/components/MarketCard';
import { PositionCard } from '@/components/PositionCard';
import { AdminPanel } from '@/components/AdminPanel';
import { EventSelector } from '@/components/EventSelector';
import { useMarket } from '@/hooks/useMarket';

const Index = () => {
  const {
    market,
    selectedAsset,
    setSelectedAsset,
    positions,
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
  } = useMarket();

  return (
    <div className="min-h-screen bg-background">
      <Header 
        wallet={wallet} 
        onConnect={connectWallet} 
        onDisconnect={disconnectWallet} 
      />

      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-lg mx-auto">
          {/* Tagline */}
          <div className="text-center mb-6">
            <p className="text-muted-foreground text-sm tracking-wide uppercase">
              Yes or No. That's it.
            </p>
          </div>

          {/* Event Selector */}
          <div className="mb-6 flex justify-center">
            <EventSelector 
              selectedAsset={selectedAsset} 
              onSelectAsset={setSelectedAsset} 
            />
          </div>

          {/* Market Card */}
          <MarketCard
            market={market}
            wallet={wallet}
            yesPercentage={yesPercentage}
            noPercentage={noPercentage}
            payoutPerSol={payoutPerSol}
            onTakeSide={takeSide}
            onConnectWallet={connectWallet}
            calculatePayout={calculatePayout}
          />

          {/* Positions */}
          {positions.length > 0 && (
            <div className="mt-6 animate-fade-in">
              <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                Your Positions
              </h2>
              <div className="space-y-3">
                {positions.map(position => (
                  <PositionCard
                    key={position.id}
                    position={position}
                    onClose={closePosition}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Footer Text */}
          <div className="text-center mt-12">
            <p className="text-xs text-muted-foreground">
              Settlement is automated and verifiable on Solana.
            </p>
          </div>
        </div>
      </main>

      {/* Admin Panel */}
      <AdminPanel market={market} onResolve={resolveMarket} />
    </div>
  );
};

export default Index;
