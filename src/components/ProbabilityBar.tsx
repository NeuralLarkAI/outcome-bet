interface ProbabilityBarProps {
  yesPercentage: number;
  noPercentage: number;
}

export function ProbabilityBar({ yesPercentage, noPercentage }: ProbabilityBarProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yes" />
          <span className="text-sm font-medium text-foreground">YES</span>
          <span className="text-lg font-bold text-yes">{yesPercentage}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-no">{noPercentage}%</span>
          <span className="text-sm font-medium text-foreground">NO</span>
          <div className="w-3 h-3 rounded-full bg-no" />
        </div>
      </div>
      
      <div className="h-3 rounded-full overflow-hidden bg-secondary flex">
        <div 
          className="h-full bg-yes transition-all duration-500 ease-out"
          style={{ width: `${yesPercentage}%` }}
        />
        <div 
          className="h-full bg-no transition-all duration-500 ease-out"
          style={{ width: `${noPercentage}%` }}
        />
      </div>
    </div>
  );
}
