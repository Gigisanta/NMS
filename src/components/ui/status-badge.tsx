'use client'

import { forwardRef } from 'react'
import { Badge, BadgeProps } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CheckCircle2, Clock, AlertCircle, XCircle, MinusCircle } from 'lucide-react'

// Payment status types
export type PaymentStatus = 'AL_DIA' | 'PENDIENTE' | 'ATRASADO' | 'SIN_PAGAR'

// Subscription status types
export type SubscriptionStatus = PaymentStatus | 'PAUSADO' | 'CANCELADO'

// Invoice status types
export type InvoiceStatus = 'PENDING' | 'VERIFIED' | 'REJECTED'

// WhatsApp message status types
export type WhatsAppStatus = 'received' | 'processed' | 'error' | 'ignored'

// Employee status
export type EmployeeStatus = 'active' | 'inactive'

// Generic status type
export type Status = PaymentStatus | SubscriptionStatus | InvoiceStatus | WhatsAppStatus | EmployeeStatus | string

interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: Status
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

interface StatusConfig {
  label: string
  color: string
  icon: React.ComponentType<{ className?: string }>
}

// Payment status configurations
const paymentStatusConfig: Record<PaymentStatus, StatusConfig> = {
  AL_DIA: {
    label: 'Al día',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
  PENDIENTE: {
    label: 'Pendiente',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
  },
  ATRASADO: {
    label: 'Atrasado',
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: AlertCircle,
  },
  SIN_PAGAR: {
    label: 'Sin pagar',
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: XCircle,
  },
}

// Invoice status configurations
const invoiceStatusConfig: Record<InvoiceStatus, StatusConfig> = {
  PENDING: {
    label: 'Pendiente',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
  },
  VERIFIED: {
    label: 'Verificado',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Rechazado',
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: XCircle,
  },
}

// WhatsApp status configurations
const whatsappStatusConfig: Record<WhatsAppStatus, StatusConfig> = {
  received: {
    label: 'Recibido',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Clock,
  },
  processed: {
    label: 'Procesado',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
  error: {
    label: 'Error',
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: AlertCircle,
  },
  ignored: {
    label: 'Ignorado',
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: MinusCircle,
  },
}

// Additional status configurations
const additionalStatusConfig: Record<string, StatusConfig> = {
  PAUSADO: {
    label: 'Pausado',
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: MinusCircle,
  },
  CANCELADO: {
    label: 'Cancelado',
    color: 'bg-slate-50 text-slate-600 border-slate-200',
    icon: XCircle,
  },
  active: {
    label: 'Activo',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
  inactive: {
    label: 'Inactivo',
    color: 'bg-slate-50 text-slate-600 border-slate-200',
    icon: MinusCircle,
  },
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
}

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
}

/**
 * StatusBadge - Unified status display component
 * Automatically determines styling based on status value
 */
export const StatusBadge = forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ status, showIcon = true, size = 'md', className, ...props }, ref) => {
    // Find the appropriate config
    const config = 
      paymentStatusConfig[status as PaymentStatus] ||
      invoiceStatusConfig[status as InvoiceStatus] ||
      whatsappStatusConfig[status as WhatsAppStatus] ||
      additionalStatusConfig[status] || {
        label: status,
        color: 'bg-slate-50 text-slate-700 border-slate-200',
        icon: Clock,
      }

    const Icon = config.icon

    return (
      <Badge
        ref={ref}
        variant="outline"
        className={cn(
          'font-medium border transition-colors',
          config.color,
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {showIcon && <Icon className={cn(iconSizes[size], 'mr-1.5')} />}
        {config.label}
      </Badge>
    )
  }
)
StatusBadge.displayName = 'StatusBadge'

/**
 * PaymentStatusBadge - Convenience component for payment statuses
 */
export const PaymentStatusBadge = forwardRef<HTMLDivElement, Omit<StatusBadgeProps, 'status'> & { status: PaymentStatus }>(
  (props, ref) => <StatusBadge ref={ref} {...props} />
)
PaymentStatusBadge.displayName = 'PaymentStatusBadge'

/**
 * InvoiceStatusBadge - Convenience component for invoice statuses
 */
export const InvoiceStatusBadge = forwardRef<HTMLDivElement, Omit<StatusBadgeProps, 'status'> & { status: InvoiceStatus }>(
  (props, ref) => <StatusBadge ref={ref} {...props} />
)
InvoiceStatusBadge.displayName = 'InvoiceStatusBadge'

/**
 * WhatsAppStatusBadge - Convenience component for WhatsApp statuses
 */
export const WhatsAppStatusBadge = forwardRef<HTMLDivElement, Omit<StatusBadgeProps, 'status'> & { status: WhatsAppStatus }>(
  (props, ref) => <StatusBadge ref={ref} {...props} />
)
WhatsAppStatusBadge.displayName = 'WhatsAppStatusBadge'

/**
 * StatusDot - Minimal dot indicator for status
 */
export function StatusDot({ status, size = 'md' }: { status: Status; size?: 'sm' | 'md' | 'lg' }) {
  const config = 
    paymentStatusConfig[status as PaymentStatus] ||
    invoiceStatusConfig[status as InvoiceStatus] ||
    whatsappStatusConfig[status as WhatsAppStatus] ||
    additionalStatusConfig[status] || {
      color: 'bg-slate-400',
    }

  // Extract the base color from the config
  const dotColorClass = config.color.includes('emerald') 
    ? 'bg-emerald-500' 
    : config.color.includes('amber')
    ? 'bg-amber-500'
    : config.color.includes('red')
    ? 'bg-red-500'
    : config.color.includes('blue')
    ? 'bg-blue-500'
    : 'bg-slate-400'

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  }

  return (
    <span 
      className={cn(
        'rounded-full flex-shrink-0',
        dotColorClass,
        dotSizes[size]
      )} 
    />
  )
}
