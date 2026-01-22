"use client";

import { useState } from "react";

interface Option {
  label: string;
  text: string;
}

interface QuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  questionText: string;
  options: Option[];
  selectedAnswer: string | null;
  onSelectAnswer: (answer: string) => void;
  showFeedback?: boolean;
  correctAnswer?: string;
  explanation?: string;
  disabled?: boolean;
}

export function QuestionCard({
  questionNumber,
  totalQuestions,
  questionText,
  options,
  selectedAnswer,
  onSelectAnswer,
  showFeedback = false,
  correctAnswer,
  explanation,
  disabled = false,
}: QuestionCardProps) {
  const getOptionStyles = (label: string): string => {
    const baseStyles =
      "w-full min-h-[48px] p-4 text-left rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";

    if (!showFeedback) {
      if (selectedAnswer === label) {
        return `${baseStyles} border-blue-500 bg-blue-50 text-blue-900`;
      }
      return `${baseStyles} border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50`;
    }

    // Feedback mode
    if (label === correctAnswer) {
      return `${baseStyles} border-green-500 bg-green-50 text-green-900`;
    }
    if (selectedAnswer === label && label !== correctAnswer) {
      return `${baseStyles} border-red-500 bg-red-50 text-red-900`;
    }
    return `${baseStyles} border-gray-200 bg-gray-50 text-gray-500`;
  };

  const getOptionIcon = (label: string): React.ReactNode => {
    if (!showFeedback) {
      return (
        <span
          className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border-2 font-semibold text-sm ${
            selectedAnswer === label
              ? "border-blue-500 bg-blue-500 text-white"
              : "border-gray-300 text-gray-600"
          }`}
        >
          {label.toUpperCase()}
        </span>
      );
    }

    // Feedback mode icons
    if (label === correctAnswer) {
      return (
        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-green-500 text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </span>
      );
    }
    if (selectedAnswer === label && label !== correctAnswer) {
      return (
        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-red-500 text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </span>
      );
    }
    return (
      <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border-2 border-gray-300 text-gray-400 font-semibold text-sm">
        {label.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Question Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <span className="text-sm font-medium text-gray-500">
          Question {questionNumber} of {totalQuestions}
        </span>
      </div>

      {/* Question Text */}
      <div className="px-6 py-6">
        <p className="text-lg text-gray-900 leading-relaxed">{questionText}</p>
      </div>

      {/* Options */}
      <div className="px-6 pb-6 space-y-3">
        {options.map((option) => (
          <button
            key={option.label}
            onClick={() => !disabled && onSelectAnswer(option.label)}
            disabled={disabled}
            className={getOptionStyles(option.label)}
            aria-pressed={selectedAnswer === option.label}
          >
            <div className="flex items-start gap-4">
              {getOptionIcon(option.label)}
              <span className="flex-1 text-base leading-relaxed pt-0.5">{option.text}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Explanation */}
      {showFeedback && explanation && (
        <div className="px-6 pb-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="font-semibold text-blue-900 mb-2">Explanation</h4>
            <p className="text-blue-800 text-sm leading-relaxed">{explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
