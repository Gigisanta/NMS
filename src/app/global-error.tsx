'use client'

import * as Sentry from '@sentry/nextjs'
import NextError from 'next/error'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Captura el error en Sentry
    Sentry.captureException(error)

    // Log para debugging
    console.error('Global error caught:', error)
  }, [error])

  return (
    <html lang="es">
      <body>
        <NextError
          statusCode={500}
          title="Algo salió mal"
          message="Disculpa,发生错误。La aplicación encontró un error inesperado."
        />
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '12px 20px',
          background: '#ef4444',
          color: 'white',
          borderRadius: '8px',
          cursor: 'pointer',
        }}>
          <button onClick={() => reset()}>Reintentar</button>
        </div>
      </body>
    </html>
  )
}
