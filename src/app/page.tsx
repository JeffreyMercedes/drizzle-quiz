"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { QUIZ_MODES, EXAM_CONFIG } from "@/lib/exam-config";

const STUDY_MODES = [
  {
    id: "practice",
    title: QUIZ_MODES.practice.name,
    description: QUIZ_MODES.practice.description,
    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    href: "/quiz/practice",
    color: "bg-blue-500",
  },
  {
    id: "section",
    title: QUIZ_MODES.section.name,
    description: QUIZ_MODES.section.description,
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    href: "/quiz/section",
    color: "bg-green-500",
  },
  {
    id: "simulation",
    title: QUIZ_MODES.simulation.name,
    description: `${EXAM_CONFIG.format.totalQuestions} questions, ${EXAM_CONFIG.timing.timeLimitMinutes} minutes`,
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    href: "/quiz/simulation",
    color: "bg-purple-500",
  },
  {
    id: "flashcards",
    title: "Flashcard Mode",
    description: "Swipe through Q&A cards",
    icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    href: "/flashcards",
    color: "bg-orange-500",
  },
  {
    id: "review",
    title: "Review Mode",
    description: "Browse all questions and explanations",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    href: "/review",
    color: "bg-teal-500",
  },
];

function StudyModeCard({
  title,
  description,
  icon,
  href,
  color,
}: {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={icon}
            />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Drizzle</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">CPCE Exam Prep</p>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Master the Counselor Preparation Comprehensive Examination with
            practice questions, timed simulations, and detailed explanations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Drizzle</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">CPCE Exam Prep</p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/dashboard" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
              Dashboard
            </Link>
            <button
              onClick={() => signOut()}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Welcome back{session.user.name ? `, ${session.user.name}` : ""}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Choose a study mode to get started.</p>
        </div>

        {/* Study Modes Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {STUDY_MODES.map((mode) => (
            <StudyModeCard key={mode.id} {...mode} />
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Exam Info</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {EXAM_CONFIG.format.totalQuestions}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Questions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {EXAM_CONFIG.format.scoredQuestions}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Scored Questions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {EXAM_CONFIG.timing.timeLimitMinutes}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Minutes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {EXAM_CONFIG.contentAreas.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Content Areas</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
