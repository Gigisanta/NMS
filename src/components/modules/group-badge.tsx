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
          'inline-flex items-center gap-1.5 rounded-full font-medium border',
          'bg-slate-100 text-slate-500 border-slate-200',
          sizeClasses[size],
          interactive && 'cursor-pointer hover:bg-slate-200 transition-colors',
          className
        )}
        onClick={onClick}
      >
        Sin grupo
      </span>
    )
  }

  return (
    <span 
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium border transition-all',
        sizeClasses[size],
        interactive && 'cursor-pointer hover:shadow-md hover:scale-105',
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
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: group.color }}
      />
      {group.name}
    </span>
  )
}
