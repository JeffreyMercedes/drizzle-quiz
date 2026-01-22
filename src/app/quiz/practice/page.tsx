"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import { ProgressBar } from "@/components/quiz/ProgressBar";
import { QuizResults } from "@/components/quiz/QuizResults";
import { Button } from "@/components/ui/Button";

interface Question {
  id: string;
  questionText: string;
  options: { label: string; text: string }[];
  topic: string;
  chapter: string;
}

interface AnswerFeedback {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
}

interface QuizResult {
  totalQuestions: number;
  correctCount: number;
  score: number;
  timeSpent: number | null;
  byDomain: Record<string, { total: number; correct: number; percentage: number }>;
}

type QuizState = "loading" | "quiz" | "results" | "error";

export default function PracticeQuizPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [quizState, setQuizState] = useState<QuizState>("loading");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [results, setResults] = useState<QuizResult | null>(null);
  const [startTime] = useState<number>(Date.now());
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch questions on mount
  useEffect(() => {
    if (status === "authenticated") {
      fetchQuestions();
    }
  }, [status]);

  const fetchQuestions = async () => {
    try {
      setQuizState("loading");
      const response = await fetch("/api/quiz/practice");
      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }
      const data = await response.json();
      setSessionId(data.sessionId);
      setQuestions(data.questions);
      setQuizState("quiz");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quiz");
      setQuizState("error");
    }
  };

  const handleSelectAnswer = (answer: string) => {
    if (!feedback) {
      setSelectedAnswer(answer);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !sessionId || !questions[currentIndex]) return;

    try {
      const response = await fetch("/api/quiz/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: questions[currentIndex].id,
          selectedAnswer,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit answer");
      }

      const result: AnswerFeedback = await response.json();
      setFeedback(result);
      setAnsweredCount((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit answer");
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setFeedback(null);
    } else {
      completeQuiz();
    }
  };

  const completeQuiz = async () => {
    if (!sessionId) return;

    try {
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
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setFeedback(null);
    setAnsweredCount(0);
    setResults(null);
    fetchQuestions();
  };

  if (status === "loading" || quizState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading quiz...</p>
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
            Practice Quiz Complete
          </h1>
          <QuizResults
            {...results}
            mode="practice"
            onRetry={handleRetry}
          />
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
            <h1 className="font-semibold text-gray-900">Practice Quiz</h1>
            <div className="w-6" /> {/* Spacer for centering */}
          </div>
          <ProgressBar
            current={answeredCount}
            total={questions.length}
            showPercentage
          />
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
            showFeedback={!!feedback}
            correctAnswer={feedback?.correctAnswer}
            explanation={feedback?.explanation}
            disabled={!!feedback}
          />
        )}

        {/* Action Button */}
        <div className="mt-6 flex justify-end">
          {!feedback ? (
            <Button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer}
              size="lg"
            >
              Submit Answer
            </Button>
          ) : (
            <Button onClick={handleNextQuestion} size="lg">
              {currentIndex < questions.length - 1 ? "Next Question" : "View Results"}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
