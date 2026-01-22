"use client";

import { useState } from "react";

interface FlashcardProps {
  front: string;
  back: string;
  explanation?: string;
  showExplanation?: boolean;
}

export function Flashcard({ front, back, explanation, showExplanation = true }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
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
          className="absolute w-full h-full rounded-xl shadow-lg border border-gray-200 bg-white p-6 flex flex-col"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-4">
            Question
          </div>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-lg text-gray-900 text-center leading-relaxed">{front}</p>
          </div>
          <div className="text-center text-sm text-gray-400 mt-4">
            Tap to reveal answer
          </div>
        </div>

        {/* Back of card (Answer) */}
        <div
          className="absolute w-full h-full rounded-xl shadow-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-white p-6 flex flex-col"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="text-xs font-medium text-green-600 uppercase tracking-wide mb-4">
            Answer
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <p className="text-lg font-medium text-gray-900 text-center leading-relaxed mb-4">
              {back}
            </p>
            {showExplanation && explanation && (
              <div className="w-full mt-4 p-4 bg-white rounded-lg border border-blue-100">
                <p className="text-sm text-gray-600 leading-relaxed">{explanation}</p>
              </div>
            )}
          </div>
          <div className="text-center text-sm text-gray-400 mt-4">
            Tap to see question
          </div>
        </div>
      </div>
    </div>
  );
}
