'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ClientForm } from './client-form'
import { GroupSelector } from './group-selector'
import { ClientProfile } from './client-profile'
import { GroupTabs } from './group-tabs'
import { formatFullName, formatPhone, getPaymentStatusConfig } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-optimized'
import { useAppStore } from '@/store'
import { Plus, Search, Loader2, Clock, ChevronLeft, ChevronRight, AlertCircle, Send } from 'lucide-react'

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
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      className="cursor-pointer hover:bg-slate-50"
      onClick={() => onClientClick(client)}
    >
      <TableCell className="py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-medium text-slate-600 text-xs">
            {initials}
          </div>
          <div>
            <div className="font-medium">{formatFullName(client.nombre, client.apellido)}</div>
            <div className="text-xs text-slate-500">{client.email}</div>
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
      <TableCell>
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className={`font-normal text-xs w-fit ${statusConfig.color || ''}`}>
            {statusConfig.label}
          </Badge>
          {isLate && (
            <Badge variant="destructive" className="text-[10px] py-0 h-4 w-fit animate-pulse">
              <AlertCircle className="w-2 h-2 mr-1" />
              Pago Atrasado
            </Badge>
          )}
        </div>
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
    </motion.tr>
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
  const [memoizedGroups, setMemoizedGroups] = useState<Group[]>([])
  const [groupsLastFetch, setGroupsLastFetch] = useState(0)

  // from store
  const setStoreGroups = useAppStore((state: any) => state.setGroups)

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
      const result = await response.json()
      if (result.success) {
        setClients(result.data)
        setTotalPages(result.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
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
    fetchClients()
  }, [fetchClients])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return
    setDeletingId(id)
    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      
      const result = await response.json()
      if (result.success) {
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
        setClients(prev => prev.map(c => 
          c.id === clientId ? { ...c, grupoId } : c
        ))
      }
    } catch (error) {
      console.error('Group change error', error)
    }
  }, [])

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold">
              Clientes
            </CardTitle>
            <CardDescription>
              Gestiona los clientes registrados
            </CardDescription>
          </div>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </Button>
        </CardHeader>

        <CardContent>
          <GroupTabs
            groups={memoizedGroups}
            selectedId={grupoFilter}
            onChange={(val) => {
              setGrupoFilter(val)
              setPage(1)
            }}
          />

          <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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
            
            {loading && (
              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
            )}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Loader2 className="w-6 h-6 animate-spin inline mr-2" />
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <Clock className="h-8 w-8 mb-2 opacity-50" />
                        <p>No se encontraron clientes</p>
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
                      onDelete={handleDelete}
                      deletingId={deletingId === client.id}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
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

      {showForm && (
         <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
           <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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

      {showProfile && selectedClientId && (
        <ClientProfile
          clientId={selectedClientId}
          onClose={handleProfileClose}
          groups={memoizedGroups}
          onSaved={fetchClients}
        />
      )}
    </div>
  )
}

export default ClientsView
