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
    const chapter = searchParams.get("chapter");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search");

    const whereClause: {
      isAiGenerated: boolean;
      topic?: string;
      chapter?: string;
      questionText?: { contains: string; mode: "insensitive" };
    } = {
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

    if (chapter) {
      whereClause.chapter = chapter;
    }

    if (search) {
      whereClause.questionText = {
        contains: search,
        mode: "insensitive",
      };
    }

    const [questions, totalCount] = await Promise.all([
      prisma.question.findMany({
        where: whereClause,
        select: {
          id: true,
          questionText: true,
          options: true,
          correctAnswer: true,
          explanation: true,
          topic: true,
          chapter: true,
          pageNumber: true,
          questionNumber: true,
        },
        orderBy: [{ chapter: "asc" }, { questionNumber: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.question.count({ where: whereClause }),
    ]);

    // Get available chapters for filter
    const chapters = await prisma.question.groupBy({
      by: ["chapter"],
      where: { isAiGenerated: false },
      orderBy: { chapter: "asc" },
    });

    return NextResponse.json({
      questions: questions.map((q) => ({
        ...q,
        options: q.options as { label: string; text: string }[],
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      filters: {
        availableChapters: chapters.map((c) => c.chapter),
        availableTopics: EXAM_CONFIG.contentAreas.map((a) => ({
          id: a.id,
          name: a.shortName,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching questions for review:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}
