import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

import { instance as prisma } from '@/instances/prisma';

jest.mock('./instances/prisma.ts', () => mockDeep());

beforeEach(() => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}))

export const prismaMock = prisma as DeepMockProxy<PrismaClient>;
