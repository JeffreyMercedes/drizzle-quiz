import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPracticeQuestions, createQuizSession } from "@/lib/quiz-engine";
import { QUIZ_MODES } from "@/lib/exam-config";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const countParam = searchParams.get("count");
    const count = countParam
      ? parseInt(countParam, 10)
      : QUIZ_MODES.practice.defaultQuestionCount;

    const questions = await getPracticeQuestions(count);
    const questionIds = questions.map((q) => q.id);
    const sessionId = await createQuizSession(
      session.user.id,
      "practice",
      questionIds
    );

    return NextResponse.json({
      sessionId,
      questions,
      totalQuestions: questions.length,
    });
  } catch (error) {
    console.error("Error fetching practice questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}
