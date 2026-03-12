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
    iconColor: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
  payments: {
    icon: CreditCard,
    iconColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  attendance: {
    icon: Calendar,
    iconColor: 'text-violet-600',
    bgColor: 'bg-violet-50',
  },
  invoices: {
    icon: FileText,
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  settings: {
    icon: Settings,
    iconColor: 'text-slate-600',
    bgColor: 'bg-slate-100',
  },
  search: {
    icon: Search,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  inbox: {
    icon: Inbox,
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  default: {
    icon: FolderOpen,
    iconColor: 'text-slate-500',
    bgColor: 'bg-slate-50',
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
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-slate-500 max-w-sm mb-6">
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
                illustration === 'clients' && 'bg-cyan-600 hover:bg-cyan-700',
                illustration === 'payments' && 'bg-emerald-600 hover:bg-emerald-700',
                illustration === 'attendance' && 'bg-violet-600 hover:bg-violet-700',
                illustration === 'invoices' && 'bg-amber-600 hover:bg-amber-700',
                !['clients', 'payments', 'attendance', 'invoices'].includes(illustration) && 'bg-slate-900 hover:bg-slate-800'
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
              className="text-slate-600"
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
      'flex items-center justify-center py-8 text-slate-400',
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
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-8 h-8 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  )
}
