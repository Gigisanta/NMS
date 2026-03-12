"use client"

import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster 
      position="top-right"
      toastOptions={{
        style: {
          background: 'white',
          border: '1px solid #e2e8f0',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '14px',
        },
        classNames: {
          error: 'border-red-200 bg-red-50',
          success: 'border-emerald-200 bg-emerald-50',
          warning: 'border-amber-200 bg-amber-50',
          info: 'border-cyan-200 bg-cyan-50',
        },
      }}
    />
  )
}
