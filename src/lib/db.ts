import { PrismaClient } from '@prisma/client'

// Singleton pattern for Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prisma Client with optimized settings
export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn']
    : ['error'],
})

// Always set in global for serverless to reuse connections
globalForPrisma.prisma = db

// Helper for transaction with retry logic
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 100
): Promise<T> {
  let lastError: Error | null = null
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }
  
  throw lastError
}

// Batch loader for N+1 query prevention
export class BatchLoader<T, R> {
  private batch: Map<string, { resolve: (value: R) => void; reject: (error: Error) => void }> = new Map()
  private timer: ReturnType<typeof setTimeout> | null = null
  
  constructor(
    private loader: (ids: string[]) => Promise<Map<string, R>>,
    private delay = 10
  ) {}
  
  load(id: string): Promise<R> {
    return new Promise((resolve, reject) => {
      this.batch.set(id, { resolve, reject })
      
      if (this.timer) {
        clearTimeout(this.timer)
      }
      
      this.timer = setTimeout(() => {
        this.executeBatch()
      }, this.delay)
    })
  }
  
  private async executeBatch() {
    const batch = new Map(this.batch)
    this.batch.clear()
    this.timer = null
    
    const ids = Array.from(batch.keys())
    
    try {
      const results = await this.loader(ids)
      
      for (const [id, { resolve }] of batch) {
        const result = results.get(id)
        if (result !== undefined) {
          resolve(result)
        }
      }
    } catch (error) {
      for (const [, { reject }] of batch) {
        reject(error as Error)
      }
    }
  }
}

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  await db.$disconnect()
}
