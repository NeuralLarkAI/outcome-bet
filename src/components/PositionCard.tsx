import { X, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Position } from '@/types/market';

interface PositionCardProps {
  position: Position;
  onClose: (id: string) => void;
}

export function PositionCard({ position, onClose }: PositionCardProps) {
  const statusConfig = {
    active: {
      icon: Clock,
      label: 'Active',
      bgClass: 'bg-secondary',
      textClass: 'text-muted-foreground',
    },
    won: {
      icon: CheckCircle2,
      label: 'Won',
      bgClass: 'bg-yes/20',
      textClass: 'text-yes',
    },
    lost: {
      icon: XCircle,
      label: 'Lost',
      bgClass: 'bg-no/20',
      textClass: 'text-no',
    },
  };

  const status = statusConfig[position.status];
  const StatusIcon = status.icon;

  return (
    <div className="glass rounded-xl p-4 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span 
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
                         ${position.side === 'YES' ? 'bg-yes/20 text-yes' : 'bg-no/20 text-no'}`}
            >
              {position.side}
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.bgClass} ${status.textClass}`}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <p className="text-xs text-muted-foreground">Committed</p>
              <p className="text-lg font-semibold text-foreground">{position.amount.toFixed(2)} SOL</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {position.status === 'won' ? 'Received' : position.status === 'lost' ? 'Lost' : 'Potential Payout'}
              </p>
              <p className={`text-lg font-semibold ${position.status === 'won' ? 'text-yes' : position.status === 'lost' ? 'text-no' : 'text-foreground'}`}>
                {position.status === 'lost' ? '0.00' : position.potentialPayout.toFixed(2)} SOL
              </p>
            </div>
          </div>
        </div>

        {position.status === 'active' && (
          <button
            onClick={() => onClose(position.id)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors group"
            title="Close position (5% fee)"
          >
            <X className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        )}
      </div>
    </div>
  );
}
