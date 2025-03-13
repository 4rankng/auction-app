import React, { useState, useEffect, useCallback } from 'react';
import databaseService from '../../services/databaseService';

interface TimerProps {
  initialSeconds: number;
  onTimeUp?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  isRunning?: boolean;
}

const Timer: React.FC<TimerProps> = ({
  initialSeconds,
  onTimeUp,
  className = '',
  size = 'md',
  isRunning = true
}) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl'
  };

  const getColorClass = () => {
    if (seconds <= 10) return 'text-red-600';
    if (seconds <= 30) return 'text-yellow-600';
    return 'text-blue-600';
  };

  const tick = useCallback(() => {
    setSeconds(prevSeconds => {
      if (prevSeconds <= 1) {
        if (onTimeUp) onTimeUp();
        return 0;
      }
      return prevSeconds - 1;
    });
  }, [onTimeUp]);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(tick, 1000);

    return () => clearInterval(timer);
  }, [tick, isRunning]);

  // Update if initialSeconds changes
  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  return (
    <div className={`font-mono font-bold ${sizeClasses[size]} ${getColorClass()} ${className}`}>
      {databaseService.formatTime(seconds)}
    </div>
  );
};

export default Timer;
