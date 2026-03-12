'use client'

import { toast as sonnerToast } from 'sonner'

// Types
type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'
type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'

interface ToastOptions {
  description?: string
  duration?: number
  position?: ToastPosition
  action?: {
    label: string
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
  }
  cancel?: {
    label: string
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
  }
  icon?: React.ReactNode
}

/**
 * Unified toast notification system
 * Wraps sonner with consistent defaults and helpers
 */
export const toast = {
  /**
   * Success toast - For successful operations
   */
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      duration: options?.duration ?? 3000,
      ...options,
    })
  },

  /**
   * Error toast - For errors and failures
   */
  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      duration: options?.duration ?? 4000,
      ...options,
    })
  },

  /**
   * Warning toast - For warnings
   */
  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      duration: options?.duration ?? 4000,
      ...options,
    })
  },

  /**
   * Info toast - For information
   */
  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      duration: options?.duration ?? 3000,
      ...options,
    })
  },

  /**
   * Loading toast - For async operations
   * Returns ID that can be used to dismiss or update
   */
  loading: (message: string, options?: ToastOptions) => {
    return sonnerToast.loading(message, {
      duration: Infinity,
      ...options,
    })
  },

  /**
   * Promise toast - Handles async operations with automatic state updates
   */
  promise: <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: Error) => string)
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
    })
  },

  /**
   * Custom toast
   */
  custom: (message: string, options?: ToastOptions) => {
    return sonnerToast(message, options)
  },

  /**
   * Dismiss a specific toast or all toasts
   */
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId)
  },
}

/**
 * Common toast messages
 */
export const toastMessages = {
  // CRUD operations
  created: (item: string) => toast.success(`${item} creado exitosamente`),
  updated: (item: string) => toast.success(`${item} actualizado exitosamente`),
  deleted: (item: string) => toast.success(`${item} eliminado exitosamente`),
  saved: () => toast.success('Cambios guardados'),
  
  // Errors
  error: {
    generic: () => toast.error('Ha ocurrido un error. Por favor, intenta de nuevo.'),
    network: () => toast.error('Error de conexión. Verifica tu conexión a internet.'),
    notFound: (item: string) => toast.error(`${item} no encontrado`),
    unauthorized: () => toast.error('No tienes permisos para realizar esta acción'),
    validation: () => toast.error('Por favor, revisa los datos ingresados'),
  },
  
  // Loading states
  loading: {
    saving: () => toast.loading('Guardando...'),
    loading: () => toast.loading('Cargando...'),
    processing: () => toast.loading('Procesando...'),
  },
  
  // Confirmations
  confirm: {
    delete: (item: string) => toast.warning(`¿Estás seguro de eliminar ${item}?`),
  },
}

/**
 * Hook for toast with common operations
 */
export function useToast() {
  return toast
}

/**
 * Toast with undo action
 */
export function toastWithUndo(
  message: string,
  onUndo: () => void,
  options?: Omit<ToastOptions, 'action'>
) {
  return toast.success(message, {
    ...options,
    action: {
      label: 'Deshacer',
      onClick: onUndo,
    },
    duration: 5000,
  })
}

/**
 * Error handler that shows toast
 */
export function handleApiError(error: unknown, fallbackMessage = 'Ha ocurrido un error') {
  console.error('API Error:', error)
  
  if (error instanceof Error) {
    toast.error(error.message || fallbackMessage)
  } else if (typeof error === 'string') {
    toast.error(error)
  } else {
    toast.error(fallbackMessage)
  }
}

export default toast
