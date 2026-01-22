import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EXAM_CONFIG, ContentAreaId } from "@/lib/exam-config";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const topic = searchParams.get("topic") as ContentAreaId | null;
    const countParam = searchParams.get("count");
    const count = countParam ? parseInt(countParam, 10) : 20;

    const whereClause: { isAiGenerated: boolean; topic?: string } = {
      isAiGenerated: false,
    };

    if (topic) {
      const validTopics = EXAM_CONFIG.contentAreas.map((a) => a.id);
      if (!validTopics.includes(topic)) {
        return NextResponse.json(
          { error: "Invalid topic", validTopics },
          { status: 400 }
        );
      }
      whereClause.topic = topic;
    }

    const questions = await prisma.question.findMany({
      where: whereClause,
      select: {
        id: true,
        questionText: true,
        options: true,
        correctAnswer: true,
        explanation: true,
        topic: true,
        chapter: true,
      },
    });

    // Shuffle and take requested count
    const shuffled = questions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    // Format as flashcards
    const flashcards = selected.map((q) => {
      const options = q.options as { label: string; text: string }[];
      const correctOption = options.find((o) => o.label === q.correctAnswer);

      return {
        id: q.id,
        front: q.questionText,
        back: correctOption?.text || q.correctAnswer,
        explanation: q.explanation,
        topic: q.topic,
        chapter: q.chapter,
        options,
        correctAnswer: q.correctAnswer,
      };
    });

    return NextResponse.json({
      flashcards,
      total: flashcards.length,
    });
  } catch (error) {
    console.error("Error fetching flashcards:", error);
    return NextResponse.json(
      { error: "Failed to fetch flashcards" },
      { status: 500 }
    );
  }
}
