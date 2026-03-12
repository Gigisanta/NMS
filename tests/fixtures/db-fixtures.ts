import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'
import { beforeAll, beforeEach, afterAll } from 'vitest'

// Create a mock Prisma client
export type PrismaClientMock = DeepMockProxy<PrismaClient>

// Mock Prisma client
export const prismaMock = mockDeep<PrismaClient>() as unknown as PrismaClientMock

// Reset mock before each test
beforeEach(() => {
  mockReset(prismaMock)
})

// Test database URL
export const TEST_DATABASE_URL = 'file:./test.db'

// Helper to setup test database
export async function setupTestDatabase() {
  // In a real scenario, you'd run migrations here
  console.log('Test database setup')
}

// Helper to teardown test database
export async function teardownTestDatabase() {
  console.log('Test database teardown')
}
