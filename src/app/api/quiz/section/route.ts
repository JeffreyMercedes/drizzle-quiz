import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSectionQuestions, createQuizSession } from "@/lib/quiz-engine";
import { QUIZ_MODES, ContentAreaId, EXAM_CONFIG } from "@/lib/exam-config";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const topic = searchParams.get("topic") as ContentAreaId;
    const countParam = searchParams.get("count");
    const count = countParam
      ? parseInt(countParam, 10)
      : QUIZ_MODES.section.defaultQuestionCount;

    if (!topic) {
      return NextResponse.json(
        { error: "Topic parameter is required" },
        { status: 400 }
      );
    }

    // Validate topic
    const validTopics = EXAM_CONFIG.contentAreas.map((a) => a.id);
    if (!validTopics.includes(topic)) {
      return NextResponse.json(
        { error: "Invalid topic", validTopics },
        { status: 400 }
      );
    }

    const questions = await getSectionQuestions(topic, count);
    const questionIds = questions.map((q) => q.id);
    const sessionId = await createQuizSession(
      session.user.id,
      "section",
      questionIds,
      topic
    );

    return NextResponse.json({
      sessionId,
      questions,
      totalQuestions: questions.length,
      topic,
    });
  } catch (error) {
    console.error("Error fetching section questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}
