"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";

interface FlashcardProps {
  front: string;
  back: string;
  explanation?: string;
  showExplanation?: boolean;
}

export function Flashcard({ front, back, explanation, showExplanation = true }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleShowExplanation = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card flip when clicking button
    setIsExplanationOpen(true);
  };

  return (
    <>
      <div
        className="w-full h-[400px] perspective-1000 cursor-pointer"
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleFlip();
          }
        }}
        aria-label={isFlipped ? "Click to see question" : "Click to see answer"}
      >
        <div
          className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front of card (Question) */}
          <div
            className="absolute w-full h-full rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 flex flex-col"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2 flex-shrink-0">
              Question
            </div>
            <div className="flex-1 overflow-y-auto flex items-center justify-center min-h-0">
              <p className="text-lg text-gray-900 dark:text-gray-100 text-center leading-relaxed">{front}</p>
            </div>
            <div className="text-center text-sm text-gray-400 dark:text-gray-500 mt-2 flex-shrink-0">
              Tap to reveal answer
            </div>
          </div>

          {/* Back of card (Answer) */}
          <div
            className="absolute w-full h-full rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 p-6 flex flex-col"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide mb-2 flex-shrink-0">
              Answer
            </div>
            <div className="flex-1 overflow-y-auto flex items-center justify-center min-h-0">
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100 text-center leading-relaxed">
                {back}
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 mt-2 flex-shrink-0">
              {showExplanation && explanation && (
                <button
                  onClick={handleShowExplanation}
                  className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                >
                  Show Explanation
                </button>
              )}
              <div className="text-center text-sm text-gray-400 dark:text-gray-500">
                Tap to see question
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Explanation Bottom Sheet */}
      <BottomSheet
        isOpen={isExplanationOpen}
        onClose={() => setIsExplanationOpen(false)}
        title="Explanation"
      >
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
          {explanation}
        </p>
      </BottomSheet>
    </>
  );
}
