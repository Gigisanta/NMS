'use client'

import { forwardRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  Users, 
  CreditCard, 
  Calendar, 
  FileText, 
  Settings, 
  Search,
  Inbox,
  FolderOpen,
  LucideIcon
} from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  illustration?: 'clients' | 'payments' | 'attendance' | 'invoices' | 'settings' | 'search' | 'inbox' | 'default'
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

const illustrationConfig: Record<string, { icon: LucideIcon; iconColor: string; bgColor: string }> = {
  clients: {
    icon: Users,
    iconColor: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  payments: {
    icon: CreditCard,
    iconColor: 'text-[var(--success)]',
    bgColor: 'bg-[var(--success)]/10',
  },
  attendance: {
    icon: Calendar,
    iconColor: 'text-[var(--chart-5)]',
    bgColor: 'bg-[var(--chart-5)]/10',
  },
  invoices: {
    icon: FileText,
    iconColor: 'text-[var(--warning)]',
    bgColor: 'bg-[var(--warning)]/10',
  },
  settings: {
    icon: Settings,
    iconColor: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
  search: {
    icon: Search,
    iconColor: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  inbox: {
    icon: Inbox,
    iconColor: 'text-[var(--warning)]',
    bgColor: 'bg-[var(--warning)]/10',
  },
  default: {
    icon: FolderOpen,
    iconColor: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
  },
}

/**
 * EmptyState - Consistent empty state component with illustrations
 * Use for empty lists, no results, and initial states
 */
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ 
    icon, 
    illustration = 'default', 
    title, 
    description, 
    action, 
    secondaryAction, 
    className 
  }, ref) => {
    const config = illustrationConfig[illustration] || illustrationConfig.default
    const Icon = icon || config.icon

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center py-12 px-4 text-center',
          className
        )}
      >
        {/* Icon Container */}
        <div className={cn(
          'w-16 h-16 rounded-2xl flex items-center justify-center mb-4',
          config.bgColor
        )}>
          <Icon className={cn('w-8 h-8', config.iconColor)} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            {description}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          {action && (
            <Button
              onClick={action.onClick}
              className={cn(
                'gap-2',
                illustration === 'clients' && 'bg-primary hover:bg-primary/90',
                illustration === 'payments' && 'bg-[var(--success)] hover:bg-[var(--success)]/90',
                illustration === 'attendance' && 'bg-[var(--chart-5)] hover:bg-[var(--chart-5)]/90',
                illustration === 'invoices' && 'bg-[var(--warning)] hover:bg-[var(--warning)]/90',
                !['clients', 'payments', 'attendance', 'invoices'].includes(illustration) && 'bg-primary hover:bg-primary/90'
              )}
            >
              {action.icon && <action.icon className="w-4 h-4" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              className="text-muted-foreground"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </div>
    )
  }
)
EmptyState.displayName = 'EmptyState'

/**
 * EmptyStateCompact - Smaller version for inline use
 */
export function EmptyStateCompact({ 
  message, 
  className 
}: { 
  message: string
  className?: string 
}) {
  return (
    <div className={cn(
      'flex items-center justify-center py-8 text-muted-foreground',
      className
    )}>
      <p className="text-sm">{message}</p>
    </div>
  )
}

/**
 * NoResults - For search/filter with no results
 */
export function NoResults({ 
  searchTerm, 
  onClear 
}: { 
  searchTerm?: string
  onClear?: () => void 
}) {
  return (
    <EmptyState
      illustration="search"
      title="Sin resultados"
      description={
        searchTerm 
          ? `No encontramos resultados para "${searchTerm}"`
          : 'No hay elementos que coincidan con los filtros'
      }
      action={onClear ? {
        label: 'Limpiar filtros',
        onClick: onClear,
        icon: Search,
      } : undefined}
    />
  )
}

/**
 * LoadingState - For loading states
 */
export function LoadingState({ message = 'Cargando...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12" role="status" aria-label={message}>
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
