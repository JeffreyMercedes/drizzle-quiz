import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: sessionId } = await params;
    const userId = session.user.id;

    // Verify the session belongs to this user
    const quizSession = await prisma.quizSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      include: {
        answers: true,
      },
    });

    if (!quizSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get the answers to update user stats
    const answerCount = quizSession.answers.length;
    const correctCount = quizSession.answers.filter((a) => a.isCorrect).length;

    // Update user stats (subtract this session's contribution)
    if (answerCount > 0) {
      // Get domain stats from answers
      const questionIds = quizSession.answers.map((a) => a.questionId);
      const questions = await prisma.question.findMany({
        where: { id: { in: questionIds } },
        select: { id: true, topic: true },
      });

      const topicMap = new Map(questions.map((q) => [q.id, q.topic]));

      // Calculate stats to subtract by domain
      const statsToSubtract: Record<string, { attempted: number; correct: number }> = {};
      for (const answer of quizSession.answers) {
        const topic = topicMap.get(answer.questionId);
        if (topic) {
          if (!statsToSubtract[topic]) {
            statsToSubtract[topic] = { attempted: 0, correct: 0 };
          }
          statsToSubtract[topic].attempted++;
          if (answer.isCorrect) {
            statsToSubtract[topic].correct++;
          }
        }
      }

      // Update user stats
      const userStats = await prisma.userStats.findUnique({
        where: { userId },
      });

      if (userStats) {
        const currentDomainStats = (userStats.statsByDomain as Record<string, { attempted: number; correct: number }>) || {};

        // Subtract from domain stats
        for (const [topic, toSubtract] of Object.entries(statsToSubtract)) {
          if (currentDomainStats[topic]) {
            currentDomainStats[topic].attempted = Math.max(0, currentDomainStats[topic].attempted - toSubtract.attempted);
            currentDomainStats[topic].correct = Math.max(0, currentDomainStats[topic].correct - toSubtract.correct);
          }
        }

        await prisma.userStats.update({
          where: { userId },
          data: {
            totalQuestionsAnswered: Math.max(0, userStats.totalQuestionsAnswered - answerCount),
            totalCorrect: Math.max(0, userStats.totalCorrect - correctCount),
            statsByDomain: currentDomainStats,
          },
        });
      }
    }

    // Delete the session (cascade will delete answers)
    await prisma.quizSession.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
