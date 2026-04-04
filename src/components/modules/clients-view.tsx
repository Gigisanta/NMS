'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { ClientForm } from './client-form'
import { GroupSelector } from './group-selector'
import { GroupManager } from './group-manager'
import { ClientProfile } from './client-profile'
import { GroupTabs } from './group-tabs'
import { formatFullName, formatPhone, getPaymentStatusConfig, cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-optimized'
import { useAppStore } from '@/store'
import { Plus, Search, Loader2, Clock, ChevronLeft, ChevronRight, AlertCircle, Send, FileCheck, Users } from 'lucide-react'

import type { Client } from '@/types'

interface Group {
  id: string
  name: string
  color: string
  clientCount: number
}

interface ClientsViewProps {
  onViewChange?: (view: string, clientId?: string) => void
}

const ClientTableRow = memo(({ client, groups, index, onClientClick, onGroupChange, onDelete, deletingId }: any) => {
  const statusConfig = getPaymentStatusConfig(
    client.currentSubscription?.status || 'PENDIENTE'
  )

  const isLate = useMemo(() => {
    const today = new Date()
    const day = today.getDate()
    return day > 10 && (client.currentSubscription?.status === 'PENDIENTE' || !client.currentSubscription)
  }, [client.currentSubscription])

  const initials = `${client.nombre?.[0] || ''}${client.apellido?.[0] || ''}`

  return (
    <tr
      className="cursor-pointer transition-colors duration-150 hover:bg-[rgba(0,168,232,0.04)]"
      onClick={() => onClientClick(client)}
    >
      <TableCell className="py-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center font-medium text-xs rounded-full text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #005691 0%, #00A8E8 100%)' }}
          >
            {initials}
          </div>
          <div>
            <div className="font-medium" style={{ color: '#1A1A1A' }}>{formatFullName(client.nombre, client.apellido)}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm">{client.dni}</span>
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <GroupSelector
          value={client.grupoId}
          onChange={(grupoId: string | null) => onGroupChange(client.id, grupoId)}
          groups={groups}
        />
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col gap-1">
          <Badge className={cn(
            "text-xs w-fit",
            (client as any).registrationFeePaid1
              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-600 border-amber-200"
          )}>
            {(client as any).registrationFeePaid1 ? <FileCheck className="w-3 h-3 mr-1 inline" /> : null}
            Cuota 1 { (client as any).registrationFeePaid1 ? "✓" : "pendiente"}
          </Badge>
          <Badge className={cn(
            "text-xs w-fit",
            (client as any).registrationFeePaid2
              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-600 border-amber-200"
          )}>
            {(client as any).registrationFeePaid2 ? <FileCheck className="w-3 h-3 mr-1 inline" /> : null}
            Cuota 2 { (client as any).registrationFeePaid2 ? "✓" : "pendiente"}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className={`font-normal text-xs w-fit ${statusConfig.color || ''}`}>
            {statusConfig.label}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        {(client as any).updatedAt ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs" style={{ color: '#86868b' }}>
              {new Date((client as any).updatedAt).toLocaleDateString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            {(client as any).updatedByUser?.name && (
              <span className="text-[10px]" style={{ color: '#005691' }}>
                por {(client as any).updatedByUser.name}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs" style={{ color: '#86868b' }}>-</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          {isLate && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs text-amber-600 border-amber-200 hover:bg-amber-50"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`https://wa.me/${client.telefono.replace(/\D/g, '')}?text=Hola%20${client.nombre},%20te%20recordamos%20que%20el%20pago%20de%20la%20cuota%20está%20pendiente.%20¡Muchas%20gracias!`, '_blank');
              }}
            >
              <Send className="w-3 h-3 mr-1" />
              Recordar
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={(e) => { e.stopPropagation(); onDelete(client.id); }}
            disabled={deletingId}
          >
            {deletingId ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Eliminar'}
          </Button>
        </div>
      </TableCell>
    </tr>
  )
})
ClientTableRow.displayName = 'ClientTableRow'

export function ClientsView({ onViewChange }: ClientsViewProps) {
  const [search, setSearch] = useState('')
  const [grupoFilter, setGrupoFilter] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [memoizedGroups, setMemoizedGroups] = useState<Group[]>([])
  const [groupsLastFetch, setGroupsLastFetch] = useState(0)

  // from store
  const setStoreGroups = useAppStore((state: any) => state.setGroups)
  const invalidateDashboard = useAppStore((state: any) => state.invalidateDashboard)

  const debouncedSearch = useDebounce(search, 300)
  const shouldFetchGroups = useMemo(() => Date.now() - groupsLastFetch > 5 * 60 * 1000, [groupsLastFetch])

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (grupoFilter) params.set('grupoId', grupoFilter)
      if (shouldFetchGroups) params.set('withSubscription', 'true')

      const response = await fetch(`/api/clients?${params}`)
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }
      const result = await response.json()
      if (result.success) {
        setClients(result.data || [])
        setTotalPages(result.pagination?.totalPages || 1)
      } else {
        console.error('API Business error:', result.error)
        setClients([]) // Clear clients on business error
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
      setClients([]) // Clear clients on error
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, grupoFilter, shouldFetchGroups, page])

  const fetchGroups = useCallback(async () => {
    if (!shouldFetchGroups) return
    try {
      const response = await fetch('/api/groups')
      const result = await response.json()
      if (result.success) {
        const groups = result.data
        setMemoizedGroups(groups)
        setStoreGroups?.(groups)
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    }
    setGroupsLastFetch(Date.now())
  }, [shouldFetchGroups, setStoreGroups])

  useEffect(() => {
    fetchClients()
    fetchGroups()
  }, [fetchClients, fetchGroups])

  const handleClientClick = useCallback((client: Client) => {
    setSelectedClientId(client.id)
    setShowProfile(true)
  }, [])

  const handleProfileClose = useCallback(() => {
    setShowProfile(false)
    setEditingClient(null)
  }, [])

  const handleFormSuccess = useCallback(() => {
    setShowForm(false)
    setEditingClient(null)
    invalidateDashboard?.()
    fetchClients()
  }, [fetchClients, invalidateDashboard])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      
      const result = await response.json()
      if (result.success) {
        invalidateDashboard?.()
        setClients(prev => prev.filter(c => c.id !== id))
      }
    } catch (error) {
      console.error('Error deleting client:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleGroupChange = useCallback(async (clientId: string, grupoId: string | null) => {
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grupoId })
      })
      if (res.ok) {
        invalidateDashboard?.()
        setClients(prev => prev.map(c =>
          c.id === clientId ? { ...c, grupoId } : c
        ))
      }
    } catch (error) {
      console.error('Group change error', error)
    }
  }, [])

  return (
    <div className="flex gap-4 h-[calc(100vh-140px)]">
      {/* Sidebar de Grupos - Vertical */}
      <div className="w-56 flex-shrink-0 flex flex-col">
        <div className="bg-white shadow-md p-4 flex-shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4" style={{ color: '#86868b' }} />
            <span className="font-medium text-sm" style={{ color: '#1A1A1A' }}>Grupos</span>
          </div>
          <div className="space-y-1">
            <button
              onClick={() => {
                setGrupoFilter(null)
                setPage(1)
              }}
              className={`w-full text-left px-3 py-2 text-sm font-medium transition-all rounded-lg ${
                grupoFilter === null
                  ? 'text-white'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
              style={grupoFilter === null ? { background: '#005691' } : {}}
            >
              Todos
            </button>
            {memoizedGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => {
                  setGrupoFilter(group.id)
                  setPage(1)
                }}
                className={`w-full text-left px-3 py-2 text-sm font-medium transition-all flex items-center gap-2 ${
                  grupoFilter === group.id 
                    ? 'text-white' 
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
                style={grupoFilter === group.id ? { background: `linear-gradient(135deg, ${group.color || '#005691'} 0%, ${group.color ? adjustColor(group.color, 30) : '#00A8E8'} 100%)` } : {}}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: grupoFilter === group.id ? 'white' : (group.color || '#00A8E8') }}
                />
                {group.name}
                <span className={`ml-auto text-xs ${grupoFilter === group.id ? 'text-white/70' : 'text-slate-400'}`}>
                  {group.clientCount || 0}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2">
          <GroupManager groups={memoizedGroups} onGroupsChange={fetchGroups} />
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="flex-1 flex flex-col min-w-0">
        <Card className="border-slate-100 shadow-sm flex flex-col h-full">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2 flex-shrink-0">
            <div>
              <CardTitle className="text-xl font-semibold">Clientes</CardTitle>
              <CardDescription>{clients.length} clientes</CardDescription>
            </div>
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Button>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col pt-0">
            <div className="relative my-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#86868b' }} />
              <Input
                placeholder="Buscar por nombre, teléfono o DNI..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-9"
              />
            </div>

            <div className="flex-1 border border-slate-100 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>DNI</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Inscripción</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Última Modificación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <Loader2 className="w-6 h-6 animate-spin inline mr-2" style={{ color: '#00A8E8' }} />
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#00A8E818' }}>
                            <Users className="w-6 h-6" style={{ color: '#00A8E8' }} />
                          </div>
                          <p className="text-sm font-medium text-slate-600">
                            {search ? `Sin resultados para "${search}"` : 'No hay clientes registrados'}
                          </p>
                          {search && (
                            <button
                              onClick={() => setSearch('')}
                              className="text-xs font-medium hover:underline"
                              style={{ color: '#005691' }}
                            >
                              Limpiar búsqueda
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map((client, index) => (
                      <ClientTableRow
                        key={client.id}
                        client={client}
                        groups={memoizedGroups}
                        index={index}
                        onClientClick={handleClientClick}
                        onGroupChange={handleGroupChange}
                        onDelete={setConfirmDeleteId}
                        deletingId={deletingId === client.id}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm text-slate-500">
                  Página {page} de {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={page >= totalPages}
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

      {/* Modal Nuevo Cliente */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-fade-in">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <CardHeader>
              <CardTitle>Nuevo Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientForm
                client={(editingClient as any) ?? undefined}
                groups={memoizedGroups}
                onSuccess={handleFormSuccess}
                onCancel={() => {
                  setShowForm(false)
                  setEditingClient(null)
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Perfil de Cliente */}
      {showProfile && selectedClientId && (
        <ClientProfile
          clientId={selectedClientId}
          onClose={handleProfileClose}
          groups={memoizedGroups}
          onSaved={fetchClients}
        />
      )}

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
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => { if (confirmDeleteId) { handleDelete(confirmDeleteId); setConfirmDeleteId(null) } }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '')
  const r = Math.min(255, parseInt(hex.substring(0, 2), 16) + amount)
  const g = Math.min(255, parseInt(hex.substring(2, 4), 16) + amount)
  const b = Math.min(255, parseInt(hex.substring(4, 6), 16) + amount)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export default ClientsView
