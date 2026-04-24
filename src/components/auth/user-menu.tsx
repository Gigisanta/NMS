'use client'

import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { LogOut, Settings, User } from 'lucide-react'
import Link from 'next/link'

interface UserMenuProps {
  onNavigate?: (view: string) => void
}

export function UserMenu({ onNavigate }: UserMenuProps) {
  const { data: session } = useSession()

  if (!session?.user) {
    return (
      <Link href="/login">
        <Button variant="ghost" className="gap-2">
          <User className="w-4 h-4" />
          Iniciar sesión
        </Button>
      </Link>
    )
  }

  const { user } = session
  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email[0].toUpperCase()

  const roleLabel = user.role === 'EMPLEADORA' ? 'Admin' : 'Empleado'
  const roleColor = user.role === 'EMPLEADORA' ? '' : 'bg-muted'
  const roleStyle = user.role === 'EMPLEADORA'
    ? { background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' }
    : {}

  const handleNavigate = (view: string) => {
    if (onNavigate) {
      onNavigate(view)
    } else {
      window.history.pushState({}, '', `/${view}`)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 gap-2 px-2 hover:bg-muted">
          <Avatar className="h-8 w-8 ring-2 ring-border shadow-md">
            <AvatarFallback className={`${roleColor} text-white text-xs font-medium`} style={roleStyle}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-medium text-foreground">{user.name || user.email}</span>
            <span className="text-xs text-muted-foreground">{roleLabel}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <Badge
              variant="outline"
              className="w-fit mt-1 text-xs"
              style={user.role === 'EMPLEADORA' ? { borderColor: 'var(--secondary)', color: 'var(--primary)' } : { borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
            >
              {roleLabel}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {user.role === 'EMPLEADORA' && (
          <>
            <DropdownMenuItem
              onClick={() => handleNavigate('configuracion')}
              className="cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
