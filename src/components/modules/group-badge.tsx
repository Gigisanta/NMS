'use client'

import { cn } from '@/lib/utils'

interface GroupBadgeProps {
  group: {
    id: string
    name: string
    color: string
  } | null
  className?: string
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  interactive?: boolean
}

export function GroupBadge({ group, className, size = 'md', onClick, interactive = false }: GroupBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }

  if (!group) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 font-medium border rounded-full',
          'text-xs px-2.5 py-0.5',
          interactive && 'cursor-pointer transition-all duration-150 hover:scale-105',
          className
        )}
        style={{
          background: 'rgba(0, 168, 232, 0.08)',
          color: '#86868b',
          borderColor: 'rgba(0, 168, 232, 0.2)',
        }}
        onClick={onClick}
      >
        Sin grupo
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border rounded-full transition-all duration-150',
        sizeClasses[size],
        interactive && 'cursor-pointer hover:shadow-sm hover:scale-105',
        className
      )}
      style={{
        backgroundColor: `${group.color}15`,
        color: group.color,
        borderColor: `${group.color}40`,
      }}
      onClick={onClick}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: group.color }}
      />
      {group.name}
    </span>
  )
}
