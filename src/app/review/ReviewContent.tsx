"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EXAM_CONFIG, ContentAreaId } from "@/lib/exam-config";

interface Question {
  id: string;
  questionText: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  topic: string;
  chapter: string;
  pageNumber: number;
  questionNumber: number;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

interface Filters {
  availableChapters: string[];
  availableTopics: { id: string; name: string }[];
}

export function ReviewContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [filters, setFilters] = useState<Filters | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  // Filter state
  const [selectedTopic, setSelectedTopic] = useState<ContentAreaId | "all">(
    (searchParams.get("topic") as ContentAreaId) || "all"
  );
  const [selectedChapter, setSelectedChapter] = useState<string>(
    searchParams.get("chapter") || "all"
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchQuestions();
    }
  }, [status, selectedTopic, selectedChapter, currentPage, searchQuery]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("limit", "20");

      if (selectedTopic !== "all") {
        params.set("topic", selectedTopic);
      }
      if (selectedChapter !== "all") {
        params.set("chapter", selectedChapter);
      }
      if (searchQuery) {
        params.set("search", searchQuery);
      }

      const response = await fetch(`/api/review?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }
      const data = await response.json();
      setQuestions(data.questions);
      setPagination(data.pagination);
      setFilters(data.filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchQuestions();
  };

  const handleTopicChange = (topic: ContentAreaId | "all") => {
    setSelectedTopic(topic);
    setCurrentPage(1);
  };

  const handleChapterChange = (chapter: string) => {
    setSelectedChapter(chapter);
    setCurrentPage(1);
  };

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId);
  };

  const getDomainName = (domainId: string): string => {
    const area = EXAM_CONFIG.contentAreas.find((a) => a.id === domainId);
    return area?.shortName || domainId;
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Review Questions</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
          {/* Search */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions..."
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button type="submit">Search</Button>
            </div>
          </form>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Content Area
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => handleTopicChange(e.target.value as ContentAreaId | "all")}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Topics</option>
                {filters?.availableTopics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Chapter
              </label>
              <select
                value={selectedChapter}
                onChange={(e) => handleChapterChange(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Chapters</option>
                {filters?.availableChapters.map((chapter) => (
                  <option key={chapter} value={chapter}>
                    {chapter}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        {pagination && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Showing {questions.length} of {pagination.totalCount} questions
          </p>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={fetchQuestions}>Retry</Button>
          </div>
        )}

        {/* Questions List */}
        {!loading && !error && (
          <div className="space-y-4">
            {questions.map((question) => (
              <div
                key={question.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() => toggleQuestion(question.id)}
                  className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                          {getDomainName(question.topic)}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          Page {question.pageNumber}
                        </span>
                      </div>
                      <p className="text-gray-900 dark:text-gray-100 line-clamp-2">{question.questionText}</p>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${
                        expandedQuestion === question.id ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedQuestion === question.id && (
                  <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="pt-4 space-y-3">
                      {question.options.map((option) => (
                        <div
                          key={option.label}
                          className={`p-3 rounded-lg ${
                            option.label === question.correctAnswer
                              ? "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700"
                              : "bg-gray-50 dark:bg-gray-700"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-sm font-medium ${
                                option.label === question.correctAnswer
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                              }`}
                            >
                              {option.label.toUpperCase()}
                            </span>
                            <span className="text-gray-900 dark:text-gray-100">{option.text}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Explanation */}
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Explanation</h4>
                      <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                        {question.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && questions.length === 0 && (
          <div className="text-center py-12">
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
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-gray-600 dark:text-gray-400">No questions found matching your filters.</p>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>

            <span className="text-sm text-gray-500 dark:text-gray-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <Button
              variant="ghost"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
