"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EXAM_CONFIG } from "@/lib/exam-config";

interface DomainResult {
  total: number;
  correct: number;
  percentage: number;
}

interface QuizResultsProps {
  totalQuestions: number;
  correctCount: number;
  score: number;
  timeSpent: number | null;
  byDomain: Record<string, DomainResult>;
  mode: string;
  onRetry?: () => void;
  onReview?: () => void;
}

export function QuizResults({
  totalQuestions,
  correctCount,
  score,
  timeSpent,
  byDomain,
  mode,
  onRetry,
  onReview,
}: QuizResultsProps) {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getScoreColor = (scorePercent: number): string => {
    if (scorePercent >= 80) return "text-green-600 dark:text-green-400";
    if (scorePercent >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBgColor = (scorePercent: number): string => {
    if (scorePercent >= 80) return "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700";
    if (scorePercent >= 60) return "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700";
    return "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700";
  };

  const getDomainName = (domainId: string): string => {
    const area = EXAM_CONFIG.contentAreas.find((a) => a.id === domainId);
    return area?.shortName || domainId;
  };

  const getDomainBarColor = (percentage: number): string => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const isPassing = score >= 66; // Common passing threshold

  return (
    <div className="max-w-2xl mx-auto">
      {/* Score Card */}
      <div
        className={`rounded-xl border-2 p-8 mb-6 text-center ${getScoreBgColor(score)}`}
      >
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
          {isPassing ? "Great Work!" : "Keep Practicing!"}
        </h2>
        <div className={`text-6xl font-bold ${getScoreColor(score)} mb-2`}>
          {Math.round(score)}%
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          {correctCount} of {totalQuestions} correct
        </p>
        {timeSpent && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Completed in {formatTime(timeSpent)}
          </p>
        )}
      </div>

      {/* Performance by Domain */}
      {Object.keys(byDomain).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Performance by Domain</h3>
          <div className="space-y-4">
            {Object.entries(byDomain)
              .sort((a, b) => a[1].percentage - b[1].percentage)
              .map(([domainId, result]) => (
                <div key={domainId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{getDomainName(domainId)}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {result.correct}/{result.total} ({Math.round(result.percentage)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getDomainBarColor(result.percentage)} rounded-full transition-all duration-300`}
                      style={{ width: `${result.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onReview && (
          <Button onClick={onReview} variant="outline" className="flex-1">
            Review Answers
          </Button>
        )}
        {onRetry && (
          <Button onClick={onRetry} className="flex-1">
            Try Again
          </Button>
        )}
        <Link href="/" className="flex-1">
          <Button variant="ghost" className="w-full">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
