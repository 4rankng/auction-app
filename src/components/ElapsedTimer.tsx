import React, { useState, useEffect, useRef } from 'react';
import './ElapsedTimer.css';

interface ElapsedTimerProps {
  initialTime: string;
  timerRef?: React.RefObject<HTMLDivElement>;
}

const ElapsedTimer: React.FC<ElapsedTimerProps> = ({ initialTime, timerRef }) => {
  const [displayTime, setDisplayTime] = useState<string>(initialTime || "00:00:00");
  const internalRef = useRef<HTMLDivElement>(null);
  const ref = timerRef || internalRef;

  // Update display time when initialTime prop changes
  useEffect(() => {
    if (initialTime) {
      setDisplayTime(initialTime);
    }
  }, [initialTime]);

  return (
    <div
      ref={ref}
      className="elapsed-timer-float"
    >
      <i className="bi bi-stopwatch" style={{ color: '#6c8dae' }}></i>
      <span style={{ fontWeight: '500', color: '#343a40' }}>{displayTime}</span>
    </div>
  );
};

export default React.memo(ElapsedTimer, (prevProps, nextProps) => {
  return prevProps.initialTime === nextProps.initialTime;
});
