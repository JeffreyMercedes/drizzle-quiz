"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ConfirmModal, AlertModal } from "@/components/ui/Modal";
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
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

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

  const handleDeleteRequest = (sessionId: string) => {
    setDeleteConfirmId(sessionId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;

    const sessionToDelete = deleteConfirmId;
    setDeletingSessionId(sessionToDelete);
    setDeleteConfirmId(null);

    try {
      const response = await fetch(`/api/sessions/${sessionToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete session");
      }

      // Refresh stats to reflect the deletion
      await fetchStats();
    } catch (err) {
      setAlertMessage(err instanceof Error ? err.message : "Failed to delete session");
    } finally {
      setDeletingSessionId(null);
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
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
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
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button onClick={fetchStats}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Message */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {session?.user?.name ? `Hello, ${session.user.name}` : "Your Progress"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Track your CPCE exam preparation progress.</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Questions Answered</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats?.totalQuestionsAnswered || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Overall Accuracy</p>
            <p className={`text-2xl font-bold ${getScoreColor(stats?.overallAccuracy || 0)}`}>
              {stats?.overallAccuracy || 0}%
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Study Streak</p>
            <p className="text-2xl font-bold text-orange-500 dark:text-orange-400">
              {stats?.streak || 0} days
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Correct Answers</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats?.totalCorrect || 0}
            </p>
          </div>
        </div>

        {/* Performance by Domain */}
        {stats && Object.keys(stats.statsByDomain).length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Performance by Content Area</h3>
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
                      <span className="text-sm text-gray-700 dark:text-gray-300">{area.shortName}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {domainStats.correct}/{domainStats.attempted} ({accuracy}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Sessions</h3>
            <div className="space-y-3">
              {stats.recentSessions.map((sess) => (
                <div
                  key={sess.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {getModeLabel(sess.mode)}
                      </span>
                      {sess.sectionFilter && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                          {getDomainName(sess.sectionFilter)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {formatDate(sess.startedAt)}
                      {sess.timeSpent && ` - ${formatTime(sess.timeSpent)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`font-semibold ${getScoreColor(sess.score)}`}>
                        {sess.score}%
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {sess.correctCount}/{sess.totalQuestions}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteRequest(sess.id)}
                      disabled={deletingSessionId === sess.id}
                      className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Delete session"
                    >
                      {deletingSessionId === sess.id ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {stats && stats.recentSessions.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center mb-8">
            <svg
              className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4"
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No study activity yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Session"
        message="Delete this session? This will update your statistics."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Error Alert Modal */}
      <AlertModal
        isOpen={alertMessage !== null}
        onClose={() => setAlertMessage(null)}
        title="Error"
        message={alertMessage || ""}
        variant="error"
      />
    </div>
  );
}
