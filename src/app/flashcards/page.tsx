"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Flashcard } from "@/components/quiz/Flashcard";
import { ProgressBar } from "@/components/quiz/ProgressBar";
import { Button } from "@/components/ui/Button";
import { EXAM_CONFIG, ContentAreaId } from "@/lib/exam-config";

interface FlashcardData {
  id: string;
  front: string;
  back: string;
  explanation: string;
  topic: string;
  chapter: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
}

type PageState = "selecting" | "loading" | "study" | "error";

export default function FlashcardsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>("selecting");
  const [selectedTopic, setSelectedTopic] = useState<ContentAreaId | "all">("all");
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchFlashcards = async (topic: ContentAreaId | "all") => {
    try {
      setPageState("loading");
      const url = topic === "all"
        ? "/api/flashcards?count=30"
        : `/api/flashcards?topic=${topic}&count=30`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch flashcards");
      }
      const data = await response.json();
      setFlashcards(data.flashcards);
      setCurrentIndex(0);
      setPageState("study");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load flashcards");
      setPageState("error");
    }
  };

  const handleTopicSelect = (topic: ContentAreaId | "all") => {
    setSelectedTopic(topic);
    fetchFlashcards(topic);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentIndex(0);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
  };

  const handleChooseDifferentTopic = () => {
    setPageState("selecting");
    setFlashcards([]);
    setCurrentIndex(0);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  // Topic Selection Screen
  if (pageState === "selecting") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
            <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Flashcards</h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Choose a topic for your flashcard study session:
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => handleTopicSelect("all")}
              className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all text-left"
            >
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">All Topics</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Mix of questions from all content areas</p>
            </button>

            {EXAM_CONFIG.contentAreas.map((area) => (
              <button
                key={area.id}
                onClick={() => handleTopicSelect(area.id)}
                className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all text-left"
              >
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{area.shortName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{area.name}</p>
              </button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (pageState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (pageState === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => fetchFlashcards(selectedTopic)}>Try Again</Button>
            <Link href="/">
              <Button variant="ghost" className="w-full">Go Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  const topicName =
    selectedTopic === "all"
      ? "All Topics"
      : EXAM_CONFIG.contentAreas.find((a) => a.id === selectedTopic)?.shortName || selectedTopic;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
            <div className="text-center">
              <h1 className="font-semibold text-gray-900 dark:text-gray-100">Flashcards</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{topicName}</p>
            </div>
            <button
              onClick={handleShuffle}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              title="Shuffle cards"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <ProgressBar
            current={currentIndex + 1}
            total={flashcards.length}
            showPercentage
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {currentCard && (
          <Flashcard
            front={currentCard.front}
            back={currentCard.back}
            explanation={currentCard.explanation}
          />
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </Button>

          <span className="text-sm text-gray-500 dark:text-gray-400">
            {currentIndex + 1} of {flashcards.length}
          </span>

          <Button
            variant="ghost"
            onClick={handleNext}
            disabled={currentIndex === flashcards.length - 1}
          >
            Next
            <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>

        {/* End of deck message */}
        {currentIndex === flashcards.length - 1 && (
          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">You've reached the end of this deck!</p>
            <div className="flex flex-col gap-3">
              <Button onClick={handleRestart}>Start Over</Button>
              <Button variant="ghost" onClick={handleChooseDifferentTopic}>
                Choose Different Topic
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
