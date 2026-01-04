import { cn } from '@/lib/utils';

export type EventAsset = 'BTC' | 'ETH' | 'SHIB' | 'DOGE';

interface EventOption {
  asset: EventAsset;
  label: string;
  pair: string;
}

const events: EventOption[] = [
  { asset: 'BTC', label: 'Bitcoin', pair: 'BTC/USD' },
  { asset: 'ETH', label: 'Ethereum', pair: 'ETH/USD' },
  { asset: 'SHIB', label: 'Shiba Inu', pair: 'SHIB/USD' },
  { asset: 'DOGE', label: 'Dogecoin', pair: 'DOGE/USD' },
];

interface EventSelectorProps {
  selectedAsset: EventAsset;
  onSelectAsset: (asset: EventAsset) => void;
}

export function EventSelector({ selectedAsset, onSelectAsset }: EventSelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {events.map((event) => (
        <button
          key={event.asset}
          onClick={() => onSelectAsset(event.asset)}
          className={cn(
            'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
            'border border-border hover:border-primary/50',
            selectedAsset === event.asset
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
          )}
        >
          {event.pair}
        </button>
      ))}
    </div>
  );
}
