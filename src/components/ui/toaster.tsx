"use client"

import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'var(--background)',
          border: '1px solid var(--border)',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          color: 'var(--foreground)',
        },
        classNames: {
          error: 'border-destructive/30 bg-destructive/10',
          success: 'border-[var(--success)]/30 bg-[var(--success)]/10',
          warning: 'border-[var(--warning)]/30 bg-[var(--warning)]/10',
          info: 'border-primary/30 bg-primary/10',
        },
      }}
    />
  )
}
