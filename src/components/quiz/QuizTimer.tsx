"use client";

import { useEffect, useState, useCallback } from "react";

interface QuizTimerProps {
  totalSeconds: number;
  onTimeUp?: () => void;
  isPaused?: boolean;
}

const WARNING_THRESHOLDS = {
  HALF: 0.5,
  QUARTER: 0.25,
  TEN_PERCENT: 0.1,
  FIVE_PERCENT: 0.05,
};

export function QuizTimer({ totalSeconds, onTimeUp, isPaused = false }: QuizTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);

  useEffect(() => {
    if (isPaused || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, remainingSeconds, onTimeUp]);

  const percentageRemaining = remainingSeconds / totalSeconds;

  const getTimerColor = (): string => {
    if (percentageRemaining <= WARNING_THRESHOLDS.FIVE_PERCENT) return "text-red-600";
    if (percentageRemaining <= WARNING_THRESHOLDS.TEN_PERCENT) return "text-red-500";
    if (percentageRemaining <= WARNING_THRESHOLDS.QUARTER) return "text-orange-500";
    return "text-gray-900";
  };

  const getProgressColor = (): string => {
    if (percentageRemaining <= WARNING_THRESHOLDS.FIVE_PERCENT) return "bg-red-500";
    if (percentageRemaining <= WARNING_THRESHOLDS.TEN_PERCENT) return "bg-red-400";
    if (percentageRemaining <= WARNING_THRESHOLDS.QUARTER) return "bg-orange-400";
    if (percentageRemaining <= WARNING_THRESHOLDS.HALF) return "bg-yellow-400";
    return "bg-green-500";
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-4">
      {/* Visual Timer Bar */}
      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getProgressColor()} transition-all duration-1000 ease-linear rounded-full`}
          style={{ width: `${percentageRemaining * 100}%` }}
        />
      </div>

      {/* Time Display */}
      <div className={`font-mono text-lg font-semibold ${getTimerColor()} min-w-[80px] text-right`}>
        {formatTime(remainingSeconds)}
      </div>

      {/* Warning Icon */}
      {percentageRemaining <= WARNING_THRESHOLDS.TEN_PERCENT && (
        <svg
          className="w-5 h-5 text-red-500 animate-pulse"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )}
    </div>
  );
}

// Compact timer for header
export function CompactTimer({ totalSeconds, onTimeUp, isPaused = false }: QuizTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);

  useEffect(() => {
    if (isPaused || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, remainingSeconds, onTimeUp]);

  const percentageRemaining = remainingSeconds / totalSeconds;

  const getTimerColor = (): string => {
    if (percentageRemaining <= WARNING_THRESHOLDS.FIVE_PERCENT) return "text-red-600 bg-red-50";
    if (percentageRemaining <= WARNING_THRESHOLDS.TEN_PERCENT) return "text-red-500 bg-red-50";
    if (percentageRemaining <= WARNING_THRESHOLDS.QUARTER) return "text-orange-600 bg-orange-50";
    return "text-gray-700 bg-gray-100";
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm font-medium ${getTimerColor()}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      {formatTime(remainingSeconds)}
    </div>
  );
}
