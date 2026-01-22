import { mockPrisma, resetPrismaMocks } from '../__mocks__/prisma';
import {
  getPracticeQuestions,
  getSectionQuestions,
  getSimulationQuestions,
  createQuizSession,
  submitAnswer,
  completeQuizSession,
  getQuestionWithAnswer,
} from '@/lib/quiz-engine';
import { EXAM_CONFIG } from '@/lib/exam-config';

// Mock data
const mockQuestions = [
  {
    id: 'q1',
    questionText: 'What is counseling?',
    options: JSON.stringify([
      { label: 'a', text: 'Option A' },
      { label: 'b', text: 'Option B' },
      { label: 'c', text: 'Option C' },
      { label: 'd', text: 'Option D' },
    ]),
    correctAnswer: 'a',
    explanation: 'Explanation for question 1',
    topic: 'professional-orientation',
    chapter: 'Professional Counseling',
    pageNumber: 50,
    questionNumber: 1,
  },
  {
    id: 'q2',
    questionText: 'What is diversity?',
    options: JSON.stringify([
      { label: 'a', text: 'Option A' },
      { label: 'b', text: 'Option B' },
      { label: 'c', text: 'Option C' },
      { label: 'd', text: 'Option D' },
    ]),
    correctAnswer: 'b',
    explanation: 'Explanation for question 2',
    topic: 'social-cultural-diversity',
    chapter: 'Social and Cultural Diversity',
    pageNumber: 86,
    questionNumber: 1,
  },
];

const mockSession = {
  id: 'session-1',
  userId: 'user-1',
  mode: 'practice',
  startedAt: new Date(),
  completedAt: null,
  totalQuestions: 2,
  correctCount: 0,
  sectionFilter: null,
  timeSpent: null,
  answers: [],
};

describe('Quiz Engine', () => {
  beforeEach(() => {
    resetPrismaMocks();
  });

  describe('getPracticeQuestions', () => {
    it('should return requested number of questions', async () => {
      mockPrisma.question.findMany.mockResolvedValue(mockQuestions);

      const questions = await getPracticeQuestions(2);

      expect(mockPrisma.question.findMany).toHaveBeenCalledWith({
        where: { isAiGenerated: false },
        select: {
          id: true,
          questionText: true,
          options: true,
          topic: true,
          chapter: true,
        },
      });
      expect(questions).toHaveLength(2);
    });

    it('should use default question count when not specified', async () => {
      mockPrisma.question.findMany.mockResolvedValue(
        Array(20).fill(mockQuestions[0])
      );

      const questions = await getPracticeQuestions();

      expect(questions.length).toBeLessThanOrEqual(15); // Default count
    });

    it('should format questions correctly', async () => {
      mockPrisma.question.findMany.mockResolvedValue([
        {
          ...mockQuestions[0],
          options: [
            { label: 'a', text: 'Option A' },
            { label: 'b', text: 'Option B' },
          ],
        },
      ]);

      const questions = await getPracticeQuestions(1);

      expect(questions[0]).toHaveProperty('id');
      expect(questions[0]).toHaveProperty('questionText');
      expect(questions[0]).toHaveProperty('options');
      expect(questions[0]).toHaveProperty('topic');
      expect(questions[0]).toHaveProperty('chapter');
    });
  });

  describe('getSectionQuestions', () => {
    it('should filter by topic', async () => {
      mockPrisma.question.findMany.mockResolvedValue([mockQuestions[0]]);

      await getSectionQuestions('professional-orientation', 10);

      expect(mockPrisma.question.findMany).toHaveBeenCalledWith({
        where: {
          topic: 'professional-orientation',
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
    });

    it('should return questions only from specified topic', async () => {
      mockPrisma.question.findMany.mockResolvedValue([mockQuestions[0]]);

      const questions = await getSectionQuestions('professional-orientation', 10);

      questions.forEach((q) => {
        expect(q.topic).toBe('professional-orientation');
      });
    });
  });

  describe('getSimulationQuestions', () => {
    it('should fetch questions from all content areas', async () => {
      // Mock returns questions for each content area
      mockPrisma.question.findMany.mockResolvedValue(
        Array(20).fill({
          ...mockQuestions[0],
          options: [
            { label: 'a', text: 'Option A' },
            { label: 'b', text: 'Option B' },
          ],
        })
      );

      await getSimulationQuestions();

      // Should be called once for each content area
      expect(mockPrisma.question.findMany).toHaveBeenCalledTimes(
        EXAM_CONFIG.contentAreas.length
      );
    });

    it('should call findMany for each content area with correct topic', async () => {
      mockPrisma.question.findMany.mockResolvedValue([]);

      await getSimulationQuestions();

      EXAM_CONFIG.contentAreas.forEach((area) => {
        expect(mockPrisma.question.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              topic: area.id,
            }),
          })
        );
      });
    });
  });

  describe('createQuizSession', () => {
    it('should create a session with correct data', async () => {
      mockPrisma.quizSession.create.mockResolvedValue(mockSession);

      const sessionId = await createQuizSession(
        'user-1',
        'practice',
        ['q1', 'q2']
      );

      expect(mockPrisma.quizSession.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          mode: 'practice',
          totalQuestions: 2,
          sectionFilter: undefined,
        },
      });
      expect(sessionId).toBe('session-1');
    });

    it('should include section filter when provided', async () => {
      mockPrisma.quizSession.create.mockResolvedValue({
        ...mockSession,
        sectionFilter: 'professional-orientation',
      });

      await createQuizSession(
        'user-1',
        'section',
        ['q1'],
        'professional-orientation'
      );

      expect(mockPrisma.quizSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sectionFilter: 'professional-orientation',
        }),
      });
    });
  });

  describe('submitAnswer', () => {
    it('should return correct result for correct answer', async () => {
      mockPrisma.question.findUnique.mockResolvedValue({
        correctAnswer: 'a',
        explanation: 'Test explanation',
      });
      mockPrisma.quizAnswer.create.mockResolvedValue({});

      const result = await submitAnswer('session-1', 'q1', 'a');

      expect(result.isCorrect).toBe(true);
      expect(result.correctAnswer).toBe('a');
      expect(result.explanation).toBe('Test explanation');
    });

    it('should return incorrect result for wrong answer', async () => {
      mockPrisma.question.findUnique.mockResolvedValue({
        correctAnswer: 'a',
        explanation: 'Test explanation',
      });
      mockPrisma.quizAnswer.create.mockResolvedValue({});

      const result = await submitAnswer('session-1', 'q1', 'b');

      expect(result.isCorrect).toBe(false);
      expect(result.correctAnswer).toBe('a');
    });

    it('should create quiz answer record', async () => {
      mockPrisma.question.findUnique.mockResolvedValue({
        correctAnswer: 'a',
        explanation: 'Test explanation',
      });
      mockPrisma.quizAnswer.create.mockResolvedValue({});

      await submitAnswer('session-1', 'q1', 'b', 30);

      expect(mockPrisma.quizAnswer.create).toHaveBeenCalledWith({
        data: {
          sessionId: 'session-1',
          questionId: 'q1',
          selectedAnswer: 'b',
          isCorrect: false,
          timeSpent: 30,
        },
      });
    });

    it('should throw error if question not found', async () => {
      mockPrisma.question.findUnique.mockResolvedValue(null);

      await expect(submitAnswer('session-1', 'invalid-q', 'a')).rejects.toThrow(
        'Question not found'
      );
    });
  });

  describe('completeQuizSession', () => {
    it('should calculate correct count and score', async () => {
      mockPrisma.quizSession.findUnique.mockResolvedValue({
        ...mockSession,
        totalQuestions: 2,
        answers: [
          {
            isCorrect: true,
            questionId: 'q1',
            selectedAnswer: 'a',
            question: { id: 'q1', correctAnswer: 'a', topic: 'professional-orientation' },
          },
          {
            isCorrect: false,
            questionId: 'q2',
            selectedAnswer: 'c',
            question: { id: 'q2', correctAnswer: 'b', topic: 'social-cultural-diversity' },
          },
        ],
      });
      mockPrisma.quizSession.update.mockResolvedValue({});
      mockPrisma.userStats.findUnique.mockResolvedValue(null);
      mockPrisma.userStats.upsert.mockResolvedValue({});

      const result = await completeQuizSession('session-1', 120);

      expect(result.correctCount).toBe(1);
      expect(result.score).toBe(50); // 1/2 = 50%
      expect(result.totalQuestions).toBe(2);
    });

    it('should update session with completion data', async () => {
      mockPrisma.quizSession.findUnique.mockResolvedValue({
        ...mockSession,
        answers: [],
      });
      mockPrisma.quizSession.update.mockResolvedValue({});
      mockPrisma.userStats.findUnique.mockResolvedValue(null);
      mockPrisma.userStats.upsert.mockResolvedValue({});

      await completeQuizSession('session-1', 120);

      expect(mockPrisma.quizSession.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: expect.objectContaining({
          completedAt: expect.any(Date),
          timeSpent: 120,
        }),
      });
    });

    it('should throw error if session not found', async () => {
      mockPrisma.quizSession.findUnique.mockResolvedValue(null);

      await expect(completeQuizSession('invalid-session')).rejects.toThrow(
        'Session not found'
      );
    });

    it('should calculate stats by domain', async () => {
      mockPrisma.quizSession.findUnique.mockResolvedValue({
        ...mockSession,
        totalQuestions: 2,
        answers: [
          {
            isCorrect: true,
            questionId: 'q1',
            selectedAnswer: 'a',
            question: { id: 'q1', correctAnswer: 'a', topic: 'professional-orientation' },
          },
          {
            isCorrect: false,
            questionId: 'q2',
            selectedAnswer: 'c',
            question: { id: 'q2', correctAnswer: 'b', topic: 'professional-orientation' },
          },
        ],
      });
      mockPrisma.quizSession.update.mockResolvedValue({});
      mockPrisma.userStats.findUnique.mockResolvedValue(null);
      mockPrisma.userStats.upsert.mockResolvedValue({});

      const result = await completeQuizSession('session-1');

      expect(result.byDomain['professional-orientation']).toEqual({
        total: 2,
        correct: 1,
        percentage: 50,
      });
    });
  });

  describe('getQuestionWithAnswer', () => {
    it('should return question with answer and explanation', async () => {
      mockPrisma.question.findUnique.mockResolvedValue({
        id: 'q1',
        questionText: 'Test question',
        options: [{ label: 'a', text: 'Option A' }],
        correctAnswer: 'a',
        explanation: 'Test explanation',
        topic: 'professional-orientation',
        chapter: 'Test Chapter',
      });

      const question = await getQuestionWithAnswer('q1');

      expect(question).toEqual({
        id: 'q1',
        questionText: 'Test question',
        options: [{ label: 'a', text: 'Option A' }],
        correctAnswer: 'a',
        explanation: 'Test explanation',
        topic: 'professional-orientation',
        chapter: 'Test Chapter',
      });
    });

    it('should return null if question not found', async () => {
      mockPrisma.question.findUnique.mockResolvedValue(null);

      const question = await getQuestionWithAnswer('invalid-id');

      expect(question).toBeNull();
    });
  });
});
