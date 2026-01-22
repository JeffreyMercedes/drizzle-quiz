import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user stats
    const userStats = await prisma.userStats.findUnique({
      where: { userId },
    });

    // Get recent quiz sessions (only those with at least one answer)
    const recentSessions = await prisma.quizSession.findMany({
      where: {
        userId,
        answers: {
          some: {}, // At least one answer exists
        },
      },
      orderBy: { startedAt: "desc" },
      take: 10,
      select: {
        id: true,
        mode: true,
        startedAt: true,
        completedAt: true,
        totalQuestions: true,
        correctCount: true,
        sectionFilter: true,
        timeSpent: true,
        _count: {
          select: { answers: true },
        },
      },
    });

    // Calculate streak (consecutive days with activity)
    const sessions = await prisma.quizSession.findMany({
      where: { userId, completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true },
    });

    let streak = 0;
    if (sessions.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let currentDate = today;
      for (const sess of sessions) {
        if (!sess.completedAt) continue;

        const sessionDate = new Date(sess.completedAt);
        sessionDate.setHours(0, 0, 0, 0);

        const diffDays = Math.floor(
          (currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays <= 1) {
          if (diffDays === 1 || (diffDays === 0 && streak === 0)) {
            streak++;
            currentDate = sessionDate;
          }
        } else {
          break;
        }
      }
    }

    // Calculate overall accuracy
    const overallAccuracy = userStats && userStats.totalQuestionsAnswered > 0
      ? (userStats.totalCorrect / userStats.totalQuestionsAnswered) * 100
      : 0;

    return NextResponse.json({
      totalQuestionsAnswered: userStats?.totalQuestionsAnswered || 0,
      totalCorrect: userStats?.totalCorrect || 0,
      overallAccuracy: Math.round(overallAccuracy),
      statsByDomain: userStats?.statsByDomain || {},
      lastStudiedAt: userStats?.lastStudiedAt,
      streak,
      recentSessions: recentSessions.map((s) => ({
        ...s,
        score: s.totalQuestions > 0
          ? Math.round((s.correctCount / s.totalQuestions) * 100)
          : 0,
      })),
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
