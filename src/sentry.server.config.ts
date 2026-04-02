import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
  ignoreErrors: ['Non-Error promise rejection captured'],
  tracesSampleRate: 0.1,
})
