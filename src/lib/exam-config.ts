// CPCE Exam Configuration
// Based on official CCE specifications

export const EXAM_CONFIG = {
  exam: "CPCE",
  fullName: "Counselor Preparation Comprehensive Examination",
  format: {
    totalQuestions: 160,
    scoredQuestions: 136,
    unscoredQuestions: 24,
    questionFormat: "multiple-choice",
  },
  timing: {
    timeLimitMinutes: 225,
    timeLimitSeconds: 225 * 60, // 13,500 seconds
  },
  scoring: {
    maxScore: 136,
    passingScoreDefault: 90, // Institution-specific, commonly ~90
  },
  contentAreas: [
    {
      id: "professional-orientation",
      name: "Professional Counseling Orientation and Ethical Practice",
      shortName: "Professional Orientation",
      totalQuestions: 20,
      scoredQuestions: 17,
    },
    {
      id: "social-cultural-diversity",
      name: "Social and Cultural Diversity",
      shortName: "Diversity",
      totalQuestions: 20,
      scoredQuestions: 17,
    },
    {
      id: "human-growth-development",
      name: "Human Growth and Development",
      shortName: "Human Development",
      totalQuestions: 20,
      scoredQuestions: 17,
    },
    {
      id: "career-development",
      name: "Career Development",
      shortName: "Career",
      totalQuestions: 20,
      scoredQuestions: 17,
    },
    {
      id: "counseling-helping-relationships",
      name: "Counseling and Helping Relationships",
      shortName: "Counseling Relationships",
      totalQuestions: 20,
      scoredQuestions: 17,
    },
    {
      id: "group-counseling",
      name: "Group Counseling and Group Work",
      shortName: "Group Work",
      totalQuestions: 20,
      scoredQuestions: 17,
    },
    {
      id: "assessment-testing",
      name: "Assessment and Testing",
      shortName: "Assessment",
      totalQuestions: 20,
      scoredQuestions: 17,
    },
    {
      id: "research-program-evaluation",
      name: "Research and Program Evaluation",
      shortName: "Research",
      totalQuestions: 20,
      scoredQuestions: 17,
    },
  ],
} as const;

export type ContentAreaId = (typeof EXAM_CONFIG.contentAreas)[number]["id"];

export const QUIZ_MODES = {
  practice: {
    name: "Practice Quiz",
    description: "Random questions from all content areas",
    defaultQuestionCount: 20,
    timed: false,
  },
  section: {
    name: "Section Quiz",
    description: "Focus on a specific content area",
    defaultQuestionCount: 20,
    timed: false,
  },
  simulation: {
    name: "Exam Simulation",
    description: "Full 160-question timed exam",
    questionCount: 160,
    timed: true,
    timeLimit: EXAM_CONFIG.timing.timeLimitMinutes,
  },
  quizplus: {
    name: "QuizPlus",
    description: "AI-generated questions (98%+ confidence)",
    defaultQuestionCount: 10,
    timed: false,
  },
} as const;

export type QuizMode = keyof typeof QUIZ_MODES;
