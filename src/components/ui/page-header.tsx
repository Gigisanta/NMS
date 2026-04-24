'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LucideIcon, Plus, ArrowLeft, ChevronRight } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  onClick?: () => void
}

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
  breadcrumbs?: BreadcrumbItem[]
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
    iconColor = 'text-primary',
    iconBg = 'bg-primary/10',
    action,
    secondaryAction,
    backAction,
    breadcrumbs,
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
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {backAction.label || 'Volver'}
          </button>
        )}

        {/* Breadcrumb trail if provided */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
            {breadcrumbs.map((item, index) => (
              <span key={index} className="flex items-center gap-1">
                {index > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                {item.onClick ? (
                  <button
                    onClick={item.onClick}
                    className="hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className={index === breadcrumbs.length - 1 ? 'text-foreground font-medium' : ''}>
                    {item.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
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
                <h1 className="text-xl font-semibold text-foreground truncate">{title}</h1>
                {badges}
              </div>
              {description && (
                <p className="text-sm text-muted-foreground mt-0.5 truncate">{description}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {secondaryAction && (
              <Button
                variant="outline"
                onClick={secondaryAction.onClick}
                className="gap-2 text-muted-foreground"
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
                  action.variant === 'secondary' && 'bg-muted text-foreground hover:bg-muted',
                  action.variant === 'ghost' && 'bg-transparent text-foreground hover:bg-muted',
                  (!action.variant || action.variant === 'primary') && 'bg-primary text-primary-foreground hover:bg-primary/90'
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
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {action && (
        <Button
          variant="ghost"
          size="sm"
          onClick={action.onClick}
          className="gap-1.5 text-muted-foreground"
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
  iconColor = 'text-primary',
  iconBg = 'bg-primary/10',
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
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        {change && (
          <p className={cn(
            'text-xs font-medium',
            change.positive ? 'text-[var(--success)]' : 'text-destructive'
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
