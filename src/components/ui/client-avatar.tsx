'use client'

import { forwardRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage, AvatarProps } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { formatFullName } from '@/lib/utils'

interface ClientAvatarProps extends AvatarProps {
  nombre: string
  apellido: string
  image?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showRing?: boolean
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

/**
 * ClientAvatar - Consistent avatar component for clients
 * Generates initials from nombre and apellido
 */
export const ClientAvatar = forwardRef<HTMLSpanElement, ClientAvatarProps>(
  ({ nombre, apellido, image, size = 'md', showRing = false, className, ...props }, ref) => {
    const initials = `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase()
    const fullName = formatFullName(nombre, apellido)

    return (
      <Avatar
        ref={ref}
        className={cn(
          sizeClasses[size],
          'bg-gradient-to-br from-cyan-600 to-cyan-500',
          showRing && 'ring-2 ring-white shadow-sm',
          className
        )}
        {...props}
      >
        {image && <AvatarImage src={image} alt={fullName} />}
        <AvatarFallback className="text-white font-medium bg-transparent">
          {initials || '?'}
        </AvatarFallback>
      </Avatar>
    )
  }
)
ClientAvatar.displayName = 'ClientAvatar'

/**
 * EmployeeAvatar - Avatar for employees/users
 */
export const EmployeeAvatar = forwardRef<HTMLSpanElement, ClientAvatarProps & {
  role?: 'EMPLEADORA' | 'EMPLEADO' | string
}>(
  ({ nombre, apellido, image, size = 'md', role, className, ...props }, ref) => {
    const initials = `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase()
    const fullName = formatFullName(nombre, apellido)

    return (
      <Avatar
        ref={ref}
        className={cn(
          sizeClasses[size],
          role === 'EMPLEADORA' 
            ? 'bg-gradient-to-br from-violet-600 to-violet-500'
            : 'bg-gradient-to-br from-slate-600 to-slate-500',
          className
        )}
        {...props}
      >
        {image && <AvatarImage src={image} alt={fullName} />}
        <AvatarFallback className="text-white font-medium bg-transparent">
          {initials || '?'}
        </AvatarFallback>
      </Avatar>
    )
  }
)
EmployeeAvatar.displayName = 'EmployeeAvatar'

/**
 * AvatarGroup - Display multiple avatars stacked
 */
export function AvatarGroup({ 
  clients, 
  max = 3, 
  size = 'sm' 
}: { 
  clients: Array<{ nombre: string; apellido: string; image?: string | null }>
  max?: number
  size?: 'sm' | 'md' | 'lg'
}) {
  const visible = clients.slice(0, max)
  const remaining = clients.length - max

  return (
    <div className="flex -space-x-2">
      {visible.map((client, i) => (
        <ClientAvatar
          key={i}
          {...client}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {remaining > 0 && (
        <div className={cn(
          sizeClasses[size],
          'rounded-full bg-slate-100 flex items-center justify-center',
          'text-slate-600 font-medium text-xs',
          'ring-2 ring-white'
        )}>
          +{remaining}
        </div>
      )}
    </div>
  )
}
