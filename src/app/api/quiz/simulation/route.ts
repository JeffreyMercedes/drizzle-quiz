import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSimulationQuestions, createQuizSession } from "@/lib/quiz-engine";
import { EXAM_CONFIG } from "@/lib/exam-config";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const questions = await getSimulationQuestions();
    const questionIds = questions.map((q) => q.id);
    const sessionId = await createQuizSession(
      session.user.id,
      "simulation",
      questionIds
    );

    return NextResponse.json({
      sessionId,
      questions,
      totalQuestions: questions.length,
      timeLimit: EXAM_CONFIG.timing.timeLimitSeconds,
    });
  } catch (error) {
    console.error("Error fetching simulation questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}
