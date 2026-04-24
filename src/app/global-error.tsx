'use client'

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
    // Log para debugging
    console.error('Global error caught:', error)
  }, [error])

  return (
    <html lang="es">
      <body>
        <NextError
          statusCode={500}
          title="Algo salió mal"
          message="Disculpa, la aplicación encontró un error inesperado."
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
          <button
            onClick={() => reset()}
            aria-label="Reintentar cargar la aplicación"
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  )
}
