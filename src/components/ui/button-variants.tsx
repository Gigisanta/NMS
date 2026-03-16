'use client'

import { forwardRef } from 'react'
import { Button, ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

/**
 * GradientButton - Primary call-to-action button with consistent gradient styling
 * Use for main actions like "Create", "Save", "Submit"
 */
export const GradientButton = forwardRef<HTMLButtonElement, ButtonProps & {
  loading?: boolean
  icon?: React.ReactNode
}>(
  ({ className, children, loading, icon, disabled, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          // Minimalist gradient - single accent color
          'bg-gradient-to-r from-cyan-600 to-cyan-500',
          'hover:from-cyan-700 hover:to-cyan-600',
          'text-white shadow-sm',
          'transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : icon ? (
          <span className="mr-2">{icon}</span>
        ) : null}
        {children}
      </Button>
    )
  }
)
GradientButton.displayName = 'GradientButton'

/**
 * SecondaryButton - For secondary actions
 */
export const SecondaryButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="outline"
        className={cn(
          'border-slate-200 bg-white',
          'hover:bg-slate-50 hover:border-slate-300',
          'text-slate-700',
          'transition-all duration-200',
          className
        )}
        {...props}
      >
        {children}
      </Button>
    )
  }
)
SecondaryButton.displayName = 'SecondaryButton'

/**
 * GhostButton - For tertiary actions
 */
export const GhostButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="ghost"
        className={cn(
          'text-slate-600',
          'hover:bg-slate-100 hover:text-slate-900',
          'transition-all duration-200',
          className
        )}
        {...props}
      >
        {children}
      </Button>
    )
  }
)
GhostButton.displayName = 'GhostButton'
