import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { submitAnswer } from "@/lib/quiz-engine";

interface SubmitAnswerRequest {
  sessionId: string;
  questionId: string;
  selectedAnswer: string;
  timeSpent?: number;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: SubmitAnswerRequest = await request.json();
    const { sessionId, questionId, selectedAnswer, timeSpent } = body;

    if (!sessionId || !questionId || !selectedAnswer) {
      return NextResponse.json(
        { error: "Missing required fields: sessionId, questionId, selectedAnswer" },
        { status: 400 }
      );
    }

    // Validate answer format
    if (!["a", "b", "c", "d"].includes(selectedAnswer.toLowerCase())) {
      return NextResponse.json(
        { error: "Invalid answer format. Must be a, b, c, or d" },
        { status: 400 }
      );
    }

    const result = await submitAnswer(
      sessionId,
      questionId,
      selectedAnswer.toLowerCase(),
      timeSpent
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error submitting answer:", error);
    return NextResponse.json(
      { error: "Failed to submit answer" },
      { status: 500 }
    );
  }
}
