import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Solo aplica en producción, en dev desactiva
const isProd = process.env.NODE_ENV === 'production'

export const ratelimit = isProd && process.env.UPSTASH_REDIS_REST_URL
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests por 10 segundos
    })
  : {
      limit: async () => ({ success: true, remaining: 999, reset: Date.now() + 1000 }),
    }
