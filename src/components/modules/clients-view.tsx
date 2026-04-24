'use client'

import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ClientForm } from './client-form'
import { GroupSelector } from './group-selector'
import { GroupManager } from './group-manager'
import { ClientProfile } from './client-profile'
import { GroupTabs } from './group-tabs'
import { formatFullName, getPaymentStatusConfig, cn, adjustColor, GROUP_COLORS } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-optimized'
import { useAppStore } from '@/store'
import { queryClient } from '@/lib/queryClient'
import { Plus, Search, Loader2, ChevronLeft, ChevronRight, Send, FileCheck, Users, Settings } from 'lucide-react'
import { toast } from 'sonner'
import type { Client } from '@/types'
import { EmptyState, NoResults } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'

// Extended Client type with subscription and group data used in this view
interface ClientRowData extends Omit<Client, 'updatedAt'> {
  currentSubscription?: {
    status: string
  } | null
  grupoId: string | null
  registrationFeePaid1?: boolean
  registrationFeePaid2?: boolean
  updatedAt?: Date | string | null
}

interface Group {
  id: string
  name: string
  color: string
  clientCount: number
}

interface ClientsViewProps {
  onViewChange?: (view: string, clientId?: string) => void
  openNewClient?: boolean
  onNewClientHandled?: () => void
}

const ClientTableRow = memo(({
  client,
  groups,
  onClientClick,
  onGroupChange,
  onGroupsRefresh,
  onDelete,
  isDeleting,
}: {
  client: ClientRowData
  groups: Group[]
  onClientClick: (client: ClientRowData) => void
  onGroupChange: (clientId: string, grupoId: string | null) => void
  onGroupsRefresh: () => void
  onDelete: (id: string) => void
  isDeleting: boolean
}) => {
  const currentSub = client.currentSubscription
  const statusConfig = getPaymentStatusConfig(currentSub?.status || 'PENDIENTE')
  const isLate = useMemo(() => {
    const day = new Date().getDate()
    return day > 10 && (currentSub?.status === 'PENDIENTE' || !currentSub)
  }, [currentSub])
  const initials = `${client.nombre?.[0] || ''}${client.apellido?.[0] || ''}`

  return (
    <TableRow
      className="cursor-pointer hover:bg-[rgba(0,168,232,0.04)] transition-colors duration-150"
      onClick={() => onClientClick(client)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClientClick(client)
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Ver perfil de ${formatFullName(client.nombre, client.apellido)}`}
    >
      <TableCell className="py-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center font-semibold text-xs rounded-full text-white shrink-0 bg-gradient-to-br from-primary to-secondary"
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">{formatFullName(client.nombre, client.apellido)}</p>
            {/* Mobile: status badge inline */}
            <div className="sm:hidden mt-0.5">
              <Badge variant="outline" className={cn('text-[10px] font-normal', statusConfig.color)}>
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
        {client.dni || '—'}
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <GroupSelector
          value={client.grupoId}
          onChange={(grupoId) => onGroupChange(client.id, grupoId)}
          groups={groups}
          onGroupsChange={onGroupsRefresh}
        />
      </TableCell>
      <TableCell className="hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col gap-1">
          {[
            { paid: client.registrationFeePaid1, label: 'Cuota 1' },
            { paid: client.registrationFeePaid2, label: 'Cuota 2' },
          ].map(({ paid, label }) => (
            <Badge
              key={label}
              className={cn(
                'text-[10px] w-fit font-normal gap-1',
                paid
                  ? 'bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]/30'
                  : 'bg-[var(--warning)]/20 text-[var(--warning)] border-[var(--warning)]/30'
              )}
            >
              {paid && <FileCheck className="w-2.5 h-2.5" />}
              {label} {paid ? '✓' : 'pendiente'}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <Badge variant="outline" className={cn('font-normal text-xs', statusConfig.color)}>
          {statusConfig.label}
        </Badge>
      </TableCell>
      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
        {client.updatedAt
          ? new Date(client.updatedAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
          : '—'
        }
      </TableCell>
      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end items-center gap-1">
          {isLate && client.telefono && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-[var(--warning)] hover:text-[var(--warning)] hover:bg-[var(--warning)]/10"
              title="Recordar pago por WhatsApp"
              onClick={() => {
                window.open(
                  `https://wa.me/${client.telefono!.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(client.nombre)},%20te%20recordamos%20que%20el%20pago%20de%20la%20cuota%20está%20pendiente.%20¡Muchas%20gracias!`,
                  '_blank'
                )
              }}
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
            title="Eliminar cliente"
            onClick={() => onDelete(client.id)}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="text-xs font-medium">✕</span>}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
})
ClientTableRow.displayName = 'ClientTableRow'

export function ClientsView({ onViewChange, openNewClient, onNewClientHandled }: ClientsViewProps) {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'EMPLEADORA'

  const [search, setSearch] = useState('')
  const [grupoFilter, setGrupoFilter] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalClients, setTotalClients] = useState(0)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [groupSortBy, setGroupSortBy] = useState<'name' | 'color'>('name')

  const setStoreGroups = useAppStore((state) => state.setGroups)
  const invalidateDashboard = useAppStore((state) => state.invalidateDashboard)

  // Use React Query for groups - automatically invalidated by group-manager
  const { data: groupsData } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const res = await fetch('/api/groups')
      const result = await res.json()
      if (result.success) {
        setStoreGroups?.(result.data)
        return result.data as Group[]
      }
      return []
    },
    staleTime: 60 * 1000,
  })
  const groups = groupsData || []

  const debouncedSearch = useDebounce(search, 300)

  // FAB trigger
  useEffect(() => {
    if (openNewClient) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowForm(true)
      onNewClientHandled?.()
    }
  }, [openNewClient, onNewClientHandled])

  const sortedGroups = useMemo(() => {
    const sorted = [...groups]
    if (groupSortBy === 'color') {
      sorted.sort((a, b) => GROUP_COLORS.indexOf(a.color as typeof GROUP_COLORS[number]) - GROUP_COLORS.indexOf(b.color as typeof GROUP_COLORS[number]))
    } else {
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'es'))
    }
    return sorted
  }, [groups, groupSortBy])

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      // First invalidate any stale queries to ensure fresh fetch
      await queryClient.invalidateQueries({ queryKey: ['clients'] })

      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('withSubscription', 'true')
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (grupoFilter) params.set('grupoId', grupoFilter)

      const res = await fetch(`/api/clients?${params}`)
      if (!res.ok) throw new Error(`API Error: ${res.status}`)
      const result = await res.json()
      if (result.success) {
        setClients(result.data || [])
        setTotalPages(result.pagination?.totalPages || 1)
        setTotalClients(result.pagination?.total || result.data?.length || 0)
      } else {
        setClients([])
      }
    } catch (err) {
      console.error('Error fetching clients:', err)
      setClients([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, grupoFilter, page])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchClients()
  }, [fetchClients])

  const handleClientClick = useCallback((client: ClientRowData) => {
    setSelectedClientId(client.id)
    setShowProfile(true)
  }, [])

  const handleProfileClose = useCallback(() => {
    setShowProfile(false)
  }, [])

  const handleFormSuccess = useCallback(async () => {
    setShowForm(false)
    invalidateDashboard()
    await fetchClients()
    queryClient.invalidateQueries({ queryKey: ['groups'] })
  }, [fetchClients, invalidateDashboard])

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) {
        invalidateDashboard()
        setClients(prev => prev.filter(c => c.id !== id))
        setTotalClients(prev => Math.max(0, prev - 1))
        toast.success('Cliente eliminado')
      } else {
        toast.error(result.error || 'Error al eliminar cliente')
      }
    } catch (err) {
      console.error('Error deleting client:', err)
      toast.error('Error de conexión')
    } finally {
      setDeletingId(null)
    }
  }, [invalidateDashboard])

  const handleGroupChange = useCallback(async (clientId: string, grupoId: string | null) => {
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grupoId }),
      })
      if (res.ok) {
        invalidateDashboard()
        setClients(prev => prev.map(c => c.id === clientId ? { ...c, grupoId } as Client : c))
      } else {
        toast.error('Error al cambiar grupo')
      }
    } catch (err) {
      console.error('Group change error:', err)
      toast.error('Error de conexión')
    }
  }, [invalidateDashboard])

  return (
    <div className="flex flex-col gap-4">
      {/* Mobile: horizontal group tabs */}
      <div className="md:hidden">
        <div className="mb-3">
          <GroupManager
            groups={groups}
            onGroupsChange={() => queryClient.invalidateQueries({ queryKey: ['groups'] })}
            trigger={
              <Button variant="outline" size="sm" className="gap-2 w-full justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50">
                <Settings className="w-4 h-4" />
                Gestionar Grupos
              </Button>
            }
          />
        </div>
        <GroupTabs
          groups={groups}
          selectedId={grupoFilter}
          onChange={(id) => { setGrupoFilter(id); setPage(1) }}
          isAdmin={isAdmin}
        />
      </div>

      <div className="flex gap-4 items-start">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col gap-2 w-52 lg:w-56 shrink-0 sticky top-4">
          <div className="bg-background rounded-xl border border-border shadow-sm p-3">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold text-sm text-muted-foreground">Grupos</span>
              <Select value={groupSortBy} onValueChange={(v) => setGroupSortBy(v as 'name' | 'color')}>
                <SelectTrigger className="ml-auto h-7 w-[90px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nombre</SelectItem>
                  <SelectItem value="color">Color</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-0.5">
              {isAdmin && (
                <button
                  onClick={() => { setGrupoFilter(null); setPage(1) }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm rounded-lg transition-all font-medium',
                    grupoFilter === null ? 'text-white' : 'text-muted-foreground hover:bg-muted/50'
                  )}
                  style={grupoFilter === null ? { background: 'var(--primary)' } : {}}
                >
                  Todos
                </button>
              )}
              {sortedGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => { setGrupoFilter(group.id); setPage(1) }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm rounded-lg transition-all flex items-center gap-2 font-medium',
                    grupoFilter === group.id ? 'text-white' : 'text-muted-foreground hover:bg-muted/50'
                  )}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: grupoFilter === group.id ? 'rgba(255,255,255,0.7)' : (group.color || 'var(--secondary)') }}
                  />
                  <span className="truncate">{group.name}</span>
                  <span className={cn('ml-auto text-xs shrink-0', grupoFilter === group.id ? 'text-white/70' : 'text-muted-foreground')}>
                    {group.clientCount || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <GroupManager
                groups={groups}
                onGroupsChange={() => queryClient.invalidateQueries({ queryKey: ['groups'] })}
                trigger={
                  <Button variant="outline" size="sm" className="gap-2 w-full justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50">
                    <Settings className="w-4 h-4" />
                    Gestionar Grupos
                  </Button>
                }
              />
        </aside>

        {/* Main table card */}
        <div className="flex-1 min-w-0">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
              <div>
                <CardTitle className="text-lg font-semibold">Clientes</CardTitle>
                <CardDescription>
                  {loading ? 'Cargando...' : `${totalClients} cliente${totalClients !== 1 ? 's' : ''} en total`}
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowForm(true)}
                size="sm"
                className="shrink-0 text-white bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Nuevo Cliente</span>
              </Button>
            </CardHeader>

            <CardContent className="pt-0 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, teléfono o DNI..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  className="pl-9"
                />
              </div>

              {/* Table */}
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="hidden sm:table-cell">DNI</TableHead>
                        <TableHead>Grupo</TableHead>
                        <TableHead className="hidden md:table-cell">Inscripción</TableHead>
                        <TableHead className="hidden sm:table-cell">Estado</TableHead>
                        <TableHead className="hidden lg:table-cell">Modificación</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading && clients.length === 0 ? (
                        <>
                          {[1, 2, 3, 4, 5].map(i => (
                            <TableRow key={i}>
                              <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            </TableRow>
                          ))}
                        </>
                      ) : clients.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7}>
                            {search ? (
                              <NoResults searchTerm={search} onClear={() => setSearch('')} />
                            ) : (
                              <EmptyState
                                illustration="clients"
                                title="No hay clientes registrados"
                                description="Carga tu primer cliente para comenzar"
                                action={{
                                  label: 'Nuevo Cliente',
                                  onClick: () => setShowForm(true),
                                  icon: Plus
                                }}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ) : (
                        clients.map((client) => (
                          <ClientTableRow
                            key={client.id}
                            client={client}
                            groups={groups}
                            onClientClick={handleClientClick}
                            onGroupChange={handleGroupChange}
                            onGroupsRefresh={() => queryClient.invalidateQueries({ queryKey: ['groups'] })}
                            onDelete={setConfirmDeleteId}
                            isDeleting={deletingId === client.id}
                          />
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1 || loading}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages || loading}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog — Nuevo Cliente */}
      <Dialog open={showForm} onOpenChange={(open) => !open && setShowForm(false)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Cliente</DialogTitle>
          </DialogHeader>
          <ClientForm
            groups={groups}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Sheet — Perfil de Cliente */}
      <Sheet open={showProfile && !!selectedClientId} onOpenChange={(open) => !open && handleProfileClose()}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 overflow-hidden">
          <SheetTitle className="sr-only">Perfil de cliente</SheetTitle>
          {selectedClientId && (
            <ClientProfile
              clientId={selectedClientId}
              onClose={handleProfileClose}
              groups={groups}
              onSaved={fetchClients}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* AlertDialog — Confirmar eliminación */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es permanente. Se eliminarán también las suscripciones y asistencias asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() => {
                if (confirmDeleteId) {
                  handleDelete(confirmDeleteId)
                  setConfirmDeleteId(null)
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ClientsView
