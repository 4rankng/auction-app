import React, { useState, useEffect, useRef, useCallback } from 'react';

interface TimerProps {
  initialTime: number;
  onTimeUp: () => void;
  status: string;
}

const Timer: React.FC<TimerProps> = ({ initialTime, onTimeUp, status }) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalTime = useRef(initialTime > 0 ? initialTime : 60); // Default to 60s if initialTime is invalid

  // Calculate visual properties
  const percentage = Math.max(0, Math.min(100, (timeLeft / totalTime.current) * 100));
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Get color based on time remaining
  const getTimerColor = useCallback(() => {
    if (timeLeft <= 0) return 'var(--neutral-400)';
    if (timeLeft <= 15) return 'var(--warning)';
    return 'var(--primary)';
  }, [timeLeft]);

  useEffect(() => {
    // Reset timer when initialTime changes
    setTimeLeft(initialTime);
    totalTime.current = initialTime > 0 ? initialTime : 60;

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Only start timer if time is positive
    if (initialTime > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Clear interval when time is up
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            // Trigger callback
            onTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // Cleanup on component unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [initialTime, onTimeUp]);

  return (
    <div className="ds-timer-circle">
      <svg width="100%" height="100%" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          className="ds-timer-bg"
          fill="transparent"
          stroke="var(--neutral-200)"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          className="ds-timer-progress"
          fill="transparent"
          stroke={getTimerColor()}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 60 60)"
        />
        <text
          x="60"
          y="60"
          textAnchor="middle"
          dominantBaseline="middle"
          className="ds-timer-text"
          style={{
            fill: getTimerColor(),
            fontSize: '18px',
            fontWeight: 'bold',
            fontFamily: 'var(--font-family-mono)'
          }}
        >
          {timeLeft > 0
            ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`
            : "Time's up!"}
        </text>
      </svg>
      <div className="ds-timer-label mt-2">
        {status === 'ending-soon' ? 'Ending Soon!' : 'Time Remaining'}
      </div>
    </div>
  );
};

export default Timer;
