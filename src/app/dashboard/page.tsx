"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EXAM_CONFIG } from "@/lib/exam-config";

interface DomainStats {
  attempted: number;
  correct: number;
}

interface RecentSession {
  id: string;
  mode: string;
  startedAt: string;
  completedAt: string | null;
  totalQuestions: number;
  correctCount: number;
  sectionFilter: string | null;
  timeSpent: number | null;
  score: number;
}

interface UserStats {
  totalQuestionsAnswered: number;
  totalCorrect: number;
  overallAccuracy: number;
  statsByDomain: Record<string, DomainStats>;
  lastStudiedAt: string | null;
  streak: number;
  recentSessions: RecentSession[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchStats();
    }
  }, [status]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  const getDomainName = (domainId: string): string => {
    const area = EXAM_CONFIG.contentAreas.find((a) => a.id === domainId);
    return area?.shortName || domainId;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const getModeLabel = (mode: string): string => {
    const labels: Record<string, string> = {
      practice: "Practice",
      section: "Section",
      simulation: "Simulation",
      quizplus: "QuizPlus",
    };
    return labels[mode] || mode;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchStats}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Message */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {session?.user?.name ? `Hello, ${session.user.name}` : "Your Progress"}
          </h2>
          <p className="text-gray-600">Track your CPCE exam preparation progress.</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Questions Answered</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats?.totalQuestionsAnswered || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Overall Accuracy</p>
            <p className={`text-2xl font-bold ${getScoreColor(stats?.overallAccuracy || 0)}`}>
              {stats?.overallAccuracy || 0}%
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Study Streak</p>
            <p className="text-2xl font-bold text-orange-500">
              {stats?.streak || 0} days
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Correct Answers</p>
            <p className="text-2xl font-bold text-green-600">
              {stats?.totalCorrect || 0}
            </p>
          </div>
        </div>

        {/* Performance by Domain */}
        {stats && Object.keys(stats.statsByDomain).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Performance by Content Area</h3>
            <div className="space-y-4">
              {EXAM_CONFIG.contentAreas.map((area) => {
                const domainStats = stats.statsByDomain[area.id];
                if (!domainStats) return null;

                const accuracy =
                  domainStats.attempted > 0
                    ? Math.round((domainStats.correct / domainStats.attempted) * 100)
                    : 0;

                return (
                  <div key={area.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{area.shortName}</span>
                      <span className="text-sm text-gray-500">
                        {domainStats.correct}/{domainStats.attempted} ({accuracy}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          accuracy >= 80
                            ? "bg-green-500"
                            : accuracy >= 60
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${accuracy}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Sessions */}
        {stats && stats.recentSessions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Sessions</h3>
            <div className="space-y-3">
              {stats.recentSessions.map((sess) => (
                <div
                  key={sess.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {getModeLabel(sess.mode)}
                      </span>
                      {sess.sectionFilter && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {getDomainName(sess.sectionFilter)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(sess.startedAt)}
                      {sess.timeSpent && ` - ${formatTime(sess.timeSpent)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getScoreColor(sess.score)}`}>
                      {sess.score}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {sess.correctCount}/{sess.totalQuestions}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {stats && stats.totalQuestionsAnswered === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No study activity yet
            </h3>
            <p className="text-gray-500 mb-6">
              Complete your first quiz to start tracking your progress.
            </p>
            <Link href="/">
              <Button>Start Studying</Button>
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/quiz/practice">
            <Button variant="outline" className="w-full">
              Practice Quiz
            </Button>
          </Link>
          <Link href="/quiz/simulation">
            <Button className="w-full">
              Exam Simulation
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
