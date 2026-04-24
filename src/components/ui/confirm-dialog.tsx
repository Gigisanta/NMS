'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2, AlertCircle, Info, CheckCircle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  variant?: 'danger' | 'warning' | 'info' | 'success'
  loading?: boolean
}

const variantConfig = {
  danger: {
    icon: Trash2,
    iconColor: 'text-destructive',
    iconBg: 'bg-destructive/10',
    buttonClass: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-[var(--warning)]',
    iconBg: 'bg-[var(--warning)]/10',
    buttonClass: 'bg-[var(--warning)] hover:bg-[var(--warning)]/90 text-white',
  },
  info: {
    icon: Info,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    buttonClass: 'bg-primary hover:bg-primary/90 text-primary-foreground',
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-[var(--success)]',
    iconBg: 'bg-[var(--success)]/10',
    buttonClass: 'bg-[var(--success)] hover:bg-[var(--success)]/90 text-white',
  },
}

/**
 * ConfirmDialog - Confirmation dialog for important actions
 * Use for destructive operations, confirmations, etc.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full ${config.iconBg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${config.iconColor}`} />
            </div>
            <div>
              <AlertDialogTitle className="text-lg">{title}</AlertDialogTitle>
              <AlertDialogDescription className="mt-1.5">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={loading}>
              {cancelLabel}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
              className={config.buttonClass}
              disabled={loading}
              onClick={(e) => {
                e.preventDefault()
                onConfirm()
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Procesando...
                </span>
              ) : (
                confirmLabel
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/**
 * DeleteDialog - Convenience component for delete confirmations
 */
export function DeleteDialog({
  open,
  onOpenChange,
  itemName,
  onConfirm,
  loading = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemName: string
  onConfirm: () => void | Promise<void>
  loading?: boolean
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Eliminar elemento"
      description={`¿Estás seguro de eliminar "${itemName}"? Esta acción no se puede deshacer.`}
      confirmLabel="Eliminar"
      variant="danger"
      onConfirm={onConfirm}
      loading={loading}
    />
  )
}

/**
 * StatusChangeDialog - Confirm status changes
 */
export function StatusChangeDialog({
  open,
  onOpenChange,
  currentStatus,
  newStatus,
  itemName,
  onConfirm,
  loading = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentStatus: string
  newStatus: string
  itemName: string
  onConfirm: () => void | Promise<void>
  loading?: boolean
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Cambiar estado"
      description={`¿Cambiar el estado de "${itemName}" de ${currentStatus} a ${newStatus}?`}
      confirmLabel="Cambiar estado"
      variant="warning"
      onConfirm={onConfirm}
      loading={loading}
    />
  )
}

/**
 * useConfirmDialog - Hook for managing confirm dialog state
 */
import { useState, useCallback } from 'react'

export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean
    title: string
    description: string
    variant: 'danger' | 'warning' | 'info' | 'success'
    onConfirm: () => void | Promise<void>
  }>({
    open: false,
    title: '',
    description: '',
    variant: 'danger',
    onConfirm: () => {},
  })

  const confirm = useCallback((
    title: string,
    description: string,
    onConfirm: () => void | Promise<void>,
    variant: 'danger' | 'warning' | 'info' | 'success' = 'danger'
  ) => {
    setState({
      open: true,
      title,
      description,
      variant,
      onConfirm,
    })
  }, [])

  const handleConfirm = useCallback(async () => {
    await state.onConfirm()
    setState(prev => ({ ...prev, open: false }))
  }, [state])

  const handleOpenChange = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, open }))
  }, [])

  return {
    confirm,
    dialogProps: {
      open: state.open,
      onOpenChange: handleOpenChange,
      title: state.title,
      description: state.description,
      variant: state.variant,
      onConfirm: handleConfirm,
    },
  }
}
