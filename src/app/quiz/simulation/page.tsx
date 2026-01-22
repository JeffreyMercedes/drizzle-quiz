"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import { ProgressBar } from "@/components/quiz/ProgressBar";
import { CompactTimer } from "@/components/quiz/QuizTimer";
import { QuizResults } from "@/components/quiz/QuizResults";
import { Button } from "@/components/ui/Button";
import { EXAM_CONFIG } from "@/lib/exam-config";

interface Question {
  id: string;
  questionText: string;
  options: { label: string; text: string }[];
  topic: string;
  chapter: string;
}

interface QuizResult {
  totalQuestions: number;
  correctCount: number;
  score: number;
  timeSpent: number | null;
  byDomain: Record<string, { total: number; correct: number; percentage: number }>;
}

type QuizState = "intro" | "loading" | "quiz" | "results" | "error";

interface AnswerRecord {
  questionId: string;
  selectedAnswer: string | null;
}

export default function SimulationQuizPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [quizState, setQuizState] = useState<QuizState>("intro");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [results, setResults] = useState<QuizResult | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [error, setError] = useState<string | null>(null);
  const [timeLimit, setTimeLimit] = useState<number>(EXAM_CONFIG.timing.timeLimitSeconds);
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchQuestions = async () => {
    try {
      setQuizState("loading");
      const response = await fetch("/api/quiz/simulation");
      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }
      const data = await response.json();
      setSessionId(data.sessionId);
      setQuestions(data.questions);
      setTimeLimit(data.timeLimit);
      setAnswers(data.questions.map((q: Question) => ({ questionId: q.id, selectedAnswer: null })));
      setStartTime(Date.now());
      setQuizState("quiz");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quiz");
      setQuizState("error");
    }
  };

  const handleSelectAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    // Save answer immediately for simulation mode
    setAnswers((prev) =>
      prev.map((a, i) =>
        i === currentIndex ? { ...a, selectedAnswer: answer } : a
      )
    );
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(answers[currentIndex + 1]?.selectedAnswer || null);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSelectedAnswer(answers[currentIndex - 1]?.selectedAnswer || null);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    setCurrentIndex(index);
    setSelectedAnswer(answers[index]?.selectedAnswer || null);
  };

  const submitAllAnswers = useCallback(async () => {
    if (!sessionId) return;

    try {
      // Submit all answers that have been selected
      for (const answer of answers) {
        if (answer.selectedAnswer) {
          await fetch("/api/quiz/answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              questionId: answer.questionId,
              selectedAnswer: answer.selectedAnswer,
            }),
          });
        }
      }

      // Complete the quiz
      const totalTimeSpent = Math.floor((Date.now() - startTime) / 1000);
      const response = await fetch("/api/quiz/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, totalTimeSpent }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete quiz");
      }

      const result: QuizResult = await response.json();
      setResults(result);
      setQuizState("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete quiz");
    }
  }, [sessionId, answers, startTime]);

  const handleTimeUp = useCallback(() => {
    submitAllAnswers();
  }, [submitAllAnswers]);

  const handleEndExam = () => {
    setShowConfirmEnd(true);
  };

  const confirmEndExam = () => {
    setShowConfirmEnd(false);
    submitAllAnswers();
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setResults(null);
    setQuizState("intro");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  // Introduction Screen
  if (quizState === "intro") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            CPCE Exam Simulation
          </h1>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-gray-600">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>{EXAM_CONFIG.format.totalQuestions} questions</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{EXAM_CONFIG.timing.timeLimitMinutes} minutes time limit</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>You can navigate between questions</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>No feedback until the end</span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-yellow-800">
              This simulation mirrors the actual CPCE exam experience. Once started, the timer cannot be paused.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={fetchQuestions} size="lg" className="w-full">
              Start Exam
            </Button>
            <Link href="/">
              <Button variant="ghost" className="w-full">
                Go Back
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (quizState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Preparing your exam...</p>
        </div>
      </div>
    );
  }

  if (quizState === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <Button onClick={fetchQuestions}>Try Again</Button>
            <Link href="/">
              <Button variant="ghost" className="w-full">Go Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (quizState === "results" && results) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Exam Simulation Complete
          </h1>
          <QuizResults
            {...results}
            mode="simulation"
            onRetry={handleRetry}
          />
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = answers.filter((a) => a.selectedAnswer !== null).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Confirm End Modal */}
      {showConfirmEnd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">End Exam?</h3>
            <p className="text-gray-600 mb-4">
              You have answered {answeredCount} of {questions.length} questions.
              {answeredCount < questions.length && (
                <span className="block mt-2 text-orange-600">
                  {questions.length - answeredCount} questions are unanswered.
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setShowConfirmEnd(false)} className="flex-1">
                Continue Exam
              </Button>
              <Button onClick={confirmEndExam} className="flex-1">
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-semibold text-gray-900">CPCE Simulation</h1>
            <CompactTimer totalSeconds={timeLimit} onTimeUp={handleTimeUp} />
          </div>
          <div className="flex items-center gap-4">
            <ProgressBar
              current={answeredCount}
              total={questions.length}
              showPercentage
            />
            <Button variant="outline" size="sm" onClick={handleEndExam}>
              End Exam
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {currentQuestion && (
          <QuestionCard
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            questionText={currentQuestion.questionText}
            options={currentQuestion.options}
            selectedAnswer={selectedAnswer}
            onSelectAnswer={handleSelectAnswer}
            showFeedback={false}
            disabled={false}
          />
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handlePreviousQuestion}
            disabled={currentIndex === 0}
          >
            Previous
          </Button>

          <span className="text-sm text-gray-500">
            {currentIndex + 1} of {questions.length}
          </span>

          <Button
            onClick={handleNextQuestion}
            disabled={currentIndex === questions.length - 1}
          >
            Next
          </Button>
        </div>

        {/* Question Navigator */}
        <div className="mt-8 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Question Navigator</h3>
          <div className="flex flex-wrap gap-2">
            {questions.map((_, index) => {
              const isAnswered = answers[index]?.selectedAnswer !== null;
              const isCurrent = index === currentIndex;
              return (
                <button
                  key={index}
                  onClick={() => handleJumpToQuestion(index)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    isCurrent
                      ? "bg-blue-500 text-white"
                      : isAnswered
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
