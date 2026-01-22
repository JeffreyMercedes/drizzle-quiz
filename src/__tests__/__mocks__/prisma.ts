// Mock Prisma client for testing
export const mockPrisma = {
  question: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  quizSession: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  quizAnswer: {
    create: jest.fn(),
  },
  userStats: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
};

// Mock the prisma module
jest.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}));

export const resetPrismaMocks = () => {
  Object.values(mockPrisma).forEach((model) => {
    Object.values(model).forEach((method) => {
      if (typeof method === 'function' && 'mockReset' in method) {
        (method as jest.Mock).mockReset();
      }
    });
  });
};
