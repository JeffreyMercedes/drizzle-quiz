"use client";

import { Suspense } from "react";
import { SectionQuizContent } from "./SectionQuizContent";

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
    </div>
  );
}

export default function SectionQuizPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SectionQuizContent />
    </Suspense>
  );
}
