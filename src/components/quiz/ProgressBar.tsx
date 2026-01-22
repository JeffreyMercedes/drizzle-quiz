"use client";

interface ProgressBarProps {
  current: number;
  total: number;
  showPercentage?: boolean;
}

export function ProgressBar({ current, total, showPercentage = false }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {current} of {total} completed
        </span>
        {showPercentage && (
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{percentage}%</span>
        )}
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={total}
        />
      </div>
    </div>
  );
}
