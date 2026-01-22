import { prisma } from "./db";
import { EXAM_CONFIG, QUIZ_MODES, QuizMode, ContentAreaId } from "./exam-config";

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: { label: string; text: string }[];
  topic: string;
  chapter: string;
}

export interface QuizQuestionWithAnswer extends QuizQuestion {
  correctAnswer: string;
  explanation: string;
}

export interface QuizSessionResult {
  sessionId: string;
  totalQuestions: number;
  correctCount: number;
  score: number; // percentage
  timeSpent: number | null;
  answers: {
    questionId: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
  byDomain: Record<
    string,
    { total: number; correct: number; percentage: number }
  >;
}

/**
 * Get random questions for practice mode
 */
export async function getPracticeQuestions(
  count: number = QUIZ_MODES.practice.defaultQuestionCount
): Promise<QuizQuestion[]> {
  const questions = await prisma.question.findMany({
    where: { isAiGenerated: false },
    select: {
      id: true,
      questionText: true,
      options: true,
      topic: true,
      chapter: true,
    },
  });

  // Shuffle and take requested count
  const shuffled = shuffleArray(questions);
  return shuffled.slice(0, count).map(formatQuestion);
}

/**
 * Get questions for a specific content area
 */
export async function getSectionQuestions(
  topic: ContentAreaId,
  count: number = QUIZ_MODES.section.defaultQuestionCount
): Promise<QuizQuestion[]> {
  const questions = await prisma.question.findMany({
    where: {
      topic,
      isAiGenerated: false,
    },
    select: {
      id: true,
      questionText: true,
      options: true,
      topic: true,
      chapter: true,
    },
  });

  const shuffled = shuffleArray(questions);
  return shuffled.slice(0, count).map(formatQuestion);
}

/**
 * Get questions for simulation mode
 * Distributes questions evenly across all 8 content areas (20 per area)
 */
export async function getSimulationQuestions(): Promise<QuizQuestion[]> {
  const allQuestions: QuizQuestion[] = [];

  for (const area of EXAM_CONFIG.contentAreas) {
    const questions = await prisma.question.findMany({
      where: {
        topic: area.id,
        isAiGenerated: false,
      },
      select: {
        id: true,
        questionText: true,
        options: true,
        topic: true,
        chapter: true,
      },
    });

    const shuffled = shuffleArray(questions);
    allQuestions.push(...shuffled.slice(0, area.totalQuestions).map(formatQuestion));
  }

  // Shuffle the final list to mix content areas
  return shuffleArray(allQuestions);
}

/**
 * Create a new quiz session
 */
export async function createQuizSession(
  userId: string,
  mode: QuizMode,
  questionIds: string[],
  sectionFilter?: string
): Promise<string> {
  const session = await prisma.quizSession.create({
    data: {
      userId,
      mode,
      totalQuestions: questionIds.length,
      sectionFilter,
    },
  });

  return session.id;
}

/**
 * Submit an answer for a question
 */
export async function submitAnswer(
  sessionId: string,
  questionId: string,
  selectedAnswer: string,
  timeSpent?: number
): Promise<{ isCorrect: boolean; correctAnswer: string; explanation: string }> {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: {
      correctAnswer: true,
      explanation: true,
    },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  const isCorrect = selectedAnswer === question.correctAnswer;

  await prisma.quizAnswer.create({
    data: {
      sessionId,
      questionId,
      selectedAnswer,
      isCorrect,
      timeSpent,
    },
  });

  return {
    isCorrect,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
  };
}

/**
 * Complete a quiz session
 */
export async function completeQuizSession(
  sessionId: string,
  totalTimeSpent?: number
): Promise<QuizSessionResult> {
  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: {
      answers: {
        include: {
          question: {
            select: {
              id: true,
              correctAnswer: true,
              topic: true,
            },
          },
        },
      },
    },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  const correctCount = session.answers.filter((a) => a.isCorrect).length;

  // Update session
  await prisma.quizSession.update({
    where: { id: sessionId },
    data: {
      completedAt: new Date(),
      correctCount,
      timeSpent: totalTimeSpent,
    },
  });

  // Update user stats
  await updateUserStats(session.userId, session.answers);

  // Calculate by domain
  const byDomain: Record<
    string,
    { total: number; correct: number; percentage: number }
  > = {};

  for (const answer of session.answers) {
    const topic = answer.question.topic;
    if (!byDomain[topic]) {
      byDomain[topic] = { total: 0, correct: 0, percentage: 0 };
    }
    byDomain[topic].total++;
    if (answer.isCorrect) {
      byDomain[topic].correct++;
    }
  }

  for (const topic of Object.keys(byDomain)) {
    byDomain[topic].percentage =
      (byDomain[topic].correct / byDomain[topic].total) * 100;
  }

  return {
    sessionId,
    totalQuestions: session.totalQuestions,
    correctCount,
    score: (correctCount / session.totalQuestions) * 100,
    timeSpent: totalTimeSpent ?? null,
    answers: session.answers.map((a) => ({
      questionId: a.questionId,
      selectedAnswer: a.selectedAnswer,
      correctAnswer: a.question.correctAnswer,
      isCorrect: a.isCorrect,
    })),
    byDomain,
  };
}

/**
 * Update user statistics after completing a quiz
 */
async function updateUserStats(
  userId: string,
  answers: { isCorrect: boolean; question: { topic: string } }[]
): Promise<void> {
  const stats = await prisma.userStats.findUnique({
    where: { userId },
  });

  const currentStatsByDomain = (stats?.statsByDomain as Record<
    string,
    { attempted: number; correct: number }
  >) || {};

  for (const answer of answers) {
    const topic = answer.question.topic;
    if (!currentStatsByDomain[topic]) {
      currentStatsByDomain[topic] = { attempted: 0, correct: 0 };
    }
    currentStatsByDomain[topic].attempted++;
    if (answer.isCorrect) {
      currentStatsByDomain[topic].correct++;
    }
  }

  const correctInSession = answers.filter((a) => a.isCorrect).length;

  await prisma.userStats.upsert({
    where: { userId },
    update: {
      totalQuestionsAnswered: { increment: answers.length },
      totalCorrect: { increment: correctInSession },
      statsByDomain: currentStatsByDomain,
      lastStudiedAt: new Date(),
    },
    create: {
      userId,
      totalQuestionsAnswered: answers.length,
      totalCorrect: correctInSession,
      statsByDomain: currentStatsByDomain,
      lastStudiedAt: new Date(),
    },
  });
}

/**
 * Get question with answer (for review mode or after answering)
 */
export async function getQuestionWithAnswer(
  questionId: string
): Promise<QuizQuestionWithAnswer | null> {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
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

  if (!question) return null;

  return {
    id: question.id,
    questionText: question.questionText,
    options: question.options as { label: string; text: string }[],
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    topic: question.topic,
    chapter: question.chapter,
  };
}

// Helper functions

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function formatQuestion(q: {
  id: string;
  questionText: string;
  options: unknown;
  topic: string;
  chapter: string;
}): QuizQuestion {
  return {
    id: q.id,
    questionText: q.questionText,
    options: q.options as { label: string; text: string }[],
    topic: q.topic,
    chapter: q.chapter,
  };
}
