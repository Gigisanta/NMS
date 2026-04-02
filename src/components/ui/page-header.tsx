'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LucideIcon, Plus, ArrowLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  iconColor?: string
  iconBg?: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
    variant?: 'primary' | 'secondary' | 'ghost'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  backAction?: {
    onClick: () => void
    label?: string
  }
  badges?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

/**
 * PageHeader - Consistent page header with title, description, and actions
 */
export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ 
    title, 
    description, 
    icon: Icon,
    iconColor = 'text-cyan-600',
    iconBg = 'bg-cyan-50',
    action,
    secondaryAction,
    backAction,
    badges,
    className,
    children
  }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-4', className)}>
        {/* Back button if provided */}
        {backAction && (
          <button
            onClick={backAction.onClick}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {backAction.label || 'Volver'}
          </button>
        )}

        {/* Main header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                iconBg
              )}>
                <Icon className={cn('w-5 h-5', iconColor)} />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-slate-900 truncate">{title}</h1>
                {badges}
              </div>
              {description && (
                <p className="text-sm text-slate-500 mt-0.5 truncate">{description}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {secondaryAction && (
              <Button
                variant="outline"
                onClick={secondaryAction.onClick}
                className="gap-2 text-slate-600"
              >
                {secondaryAction.icon && <secondaryAction.icon className="w-4 h-4" />}
                {secondaryAction.label}
              </Button>
            )}
            {action && (
              <Button
                onClick={action.onClick}
                className={cn(
                  'gap-2',
                  action.variant === 'secondary' && 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                  action.variant === 'ghost' && 'bg-transparent text-slate-700 hover:bg-slate-100',
                  (!action.variant || action.variant === 'primary') && 'bg-cyan-600 text-white hover:bg-cyan-700'
                )}
              >
                {action.icon && <action.icon className="w-4 h-4" />}
                {action.label}
              </Button>
            )}
          </div>
        </div>

        {/* Additional content */}
        {children}
      </div>
    )
  }
)
PageHeader.displayName = 'PageHeader'

/**
 * SectionHeader - For subsections within a page
 */
export function SectionHeader({ 
  title, 
  description, 
  action,
  className 
}: { 
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && (
          <p className="text-sm text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      {action && (
        <Button
          variant="ghost"
          size="sm"
          onClick={action.onClick}
          className="gap-1.5 text-slate-600"
        >
          {action.icon && <action.icon className="w-4 h-4" />}
          {action.label}
        </Button>
      )}
    </div>
  )
}

/**
 * StatHeader - Header for stat cards
 */
export function StatHeader({
  title,
  value,
  change,
  icon: Icon,
  iconColor = 'text-cyan-600',
  iconBg = 'bg-cyan-50',
}: {
  title: string
  value: string | number
  change?: { value: number; positive: boolean }
  icon?: LucideIcon
  iconColor?: string
  iconBg?: string
}) {
  return (
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        {change && (
          <p className={cn(
            'text-xs font-medium',
            change.positive ? 'text-emerald-600' : 'text-red-600'
          )}>
            {change.positive ? '+' : ''}{change.value}%
          </p>
        )}
      </div>
      {Icon && (
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          iconBg
        )}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
      )}
    </div>
  )
}
