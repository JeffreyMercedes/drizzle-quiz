import { EXAM_CONFIG, QUIZ_MODES, ContentAreaId } from '@/lib/exam-config';

describe('EXAM_CONFIG', () => {
  describe('exam metadata', () => {
    it('should have correct exam name', () => {
      expect(EXAM_CONFIG.exam).toBe('CPCE');
      expect(EXAM_CONFIG.fullName).toBe('Counselor Preparation Comprehensive Examination');
    });
  });

  describe('format configuration', () => {
    it('should have 160 total questions', () => {
      expect(EXAM_CONFIG.format.totalQuestions).toBe(160);
    });

    it('should have 136 scored questions', () => {
      expect(EXAM_CONFIG.format.scoredQuestions).toBe(136);
    });

    it('should have 24 unscored questions', () => {
      expect(EXAM_CONFIG.format.unscoredQuestions).toBe(24);
    });

    it('should have correct question format', () => {
      expect(EXAM_CONFIG.format.questionFormat).toBe('multiple-choice');
    });

    it('scored + unscored should equal total', () => {
      const { scoredQuestions, unscoredQuestions, totalQuestions } = EXAM_CONFIG.format;
      expect(scoredQuestions + unscoredQuestions).toBe(totalQuestions);
    });
  });

  describe('timing configuration', () => {
    it('should have 225 minutes time limit', () => {
      expect(EXAM_CONFIG.timing.timeLimitMinutes).toBe(225);
    });

    it('should have correct seconds conversion', () => {
      expect(EXAM_CONFIG.timing.timeLimitSeconds).toBe(225 * 60);
      expect(EXAM_CONFIG.timing.timeLimitSeconds).toBe(13500);
    });
  });

  describe('scoring configuration', () => {
    it('should have max score of 136', () => {
      expect(EXAM_CONFIG.scoring.maxScore).toBe(136);
    });

    it('should have default passing score of 90', () => {
      expect(EXAM_CONFIG.scoring.passingScoreDefault).toBe(90);
    });
  });

  describe('content areas', () => {
    it('should have exactly 8 content areas', () => {
      expect(EXAM_CONFIG.contentAreas).toHaveLength(8);
    });

    it('each content area should have 20 total questions', () => {
      EXAM_CONFIG.contentAreas.forEach((area) => {
        expect(area.totalQuestions).toBe(20);
      });
    });

    it('each content area should have 17 scored questions', () => {
      EXAM_CONFIG.contentAreas.forEach((area) => {
        expect(area.scoredQuestions).toBe(17);
      });
    });

    it('total questions across all areas should equal exam total', () => {
      const totalFromAreas = EXAM_CONFIG.contentAreas.reduce(
        (sum, area) => sum + area.totalQuestions,
        0
      );
      expect(totalFromAreas).toBe(EXAM_CONFIG.format.totalQuestions);
    });

    it('scored questions across all areas should equal exam scored total', () => {
      const scoredFromAreas = EXAM_CONFIG.contentAreas.reduce(
        (sum, area) => sum + area.scoredQuestions,
        0
      );
      expect(scoredFromAreas).toBe(EXAM_CONFIG.format.scoredQuestions);
    });

    it('should have required fields for each content area', () => {
      EXAM_CONFIG.contentAreas.forEach((area) => {
        expect(area.id).toBeDefined();
        expect(area.name).toBeDefined();
        expect(area.shortName).toBeDefined();
        expect(area.totalQuestions).toBeDefined();
        expect(area.scoredQuestions).toBeDefined();
      });
    });

    it('should have unique ids for each content area', () => {
      const ids = EXAM_CONFIG.contentAreas.map((area) => area.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should include all expected content areas', () => {
      const expectedIds: ContentAreaId[] = [
        'professional-orientation',
        'social-cultural-diversity',
        'human-growth-development',
        'career-development',
        'counseling-helping-relationships',
        'group-counseling',
        'assessment-testing',
        'research-program-evaluation',
      ];
      const actualIds = EXAM_CONFIG.contentAreas.map((area) => area.id);
      expect(actualIds).toEqual(expectedIds);
    });
  });
});

describe('QUIZ_MODES', () => {
  describe('practice mode', () => {
    it('should have correct configuration', () => {
      expect(QUIZ_MODES.practice.name).toBe('Practice Quiz');
      expect(QUIZ_MODES.practice.defaultQuestionCount).toBe(15);
      expect(QUIZ_MODES.practice.timed).toBe(false);
    });
  });

  describe('section mode', () => {
    it('should have correct configuration', () => {
      expect(QUIZ_MODES.section.name).toBe('Section Quiz');
      expect(QUIZ_MODES.section.defaultQuestionCount).toBe(20);
      expect(QUIZ_MODES.section.timed).toBe(false);
    });
  });

  describe('simulation mode', () => {
    it('should have correct configuration', () => {
      expect(QUIZ_MODES.simulation.name).toBe('Exam Simulation');
      expect(QUIZ_MODES.simulation.questionCount).toBe(160);
      expect(QUIZ_MODES.simulation.timed).toBe(true);
      expect(QUIZ_MODES.simulation.timeLimit).toBe(EXAM_CONFIG.timing.timeLimitMinutes);
    });

    it('should match exam format for question count', () => {
      expect(QUIZ_MODES.simulation.questionCount).toBe(EXAM_CONFIG.format.totalQuestions);
    });
  });

  describe('quizplus mode', () => {
    it('should have correct configuration', () => {
      expect(QUIZ_MODES.quizplus.name).toBe('QuizPlus');
      expect(QUIZ_MODES.quizplus.defaultQuestionCount).toBe(10);
      expect(QUIZ_MODES.quizplus.timed).toBe(false);
    });
  });
});
