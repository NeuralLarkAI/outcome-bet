import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: Date;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - Date.now();
      
      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-secondary flex items-center justify-center">
        <span className="text-xl sm:text-2xl font-bold text-foreground">
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs text-muted-foreground mt-1.5 uppercase tracking-wide">{label}</span>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span className="text-sm font-medium">Settlement in</span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <TimeBlock value={timeLeft.days} label="Days" />
        <span className="text-2xl text-muted-foreground font-light">:</span>
        <TimeBlock value={timeLeft.hours} label="Hrs" />
        <span className="text-2xl text-muted-foreground font-light">:</span>
        <TimeBlock value={timeLeft.minutes} label="Min" />
        <span className="text-2xl text-muted-foreground font-light hidden sm:block">:</span>
        <div className="hidden sm:block">
          <TimeBlock value={timeLeft.seconds} label="Sec" />
        </div>
      </div>
    </div>
  );
}
