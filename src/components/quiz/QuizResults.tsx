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
    if (scorePercent >= 80) return "text-green-600";
    if (scorePercent >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (scorePercent: number): string => {
    if (scorePercent >= 80) return "bg-green-50 border-green-200";
    if (scorePercent >= 60) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
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
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          {isPassing ? "Great Work!" : "Keep Practicing!"}
        </h2>
        <div className={`text-6xl font-bold ${getScoreColor(score)} mb-2`}>
          {Math.round(score)}%
        </div>
        <p className="text-gray-600">
          {correctCount} of {totalQuestions} correct
        </p>
        {timeSpent && (
          <p className="text-sm text-gray-500 mt-2">
            Completed in {formatTime(timeSpent)}
          </p>
        )}
      </div>

      {/* Performance by Domain */}
      {Object.keys(byDomain).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Performance by Domain</h3>
          <div className="space-y-4">
            {Object.entries(byDomain)
              .sort((a, b) => a[1].percentage - b[1].percentage)
              .map(([domainId, result]) => (
                <div key={domainId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{getDomainName(domainId)}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {result.correct}/{result.total} ({Math.round(result.percentage)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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
