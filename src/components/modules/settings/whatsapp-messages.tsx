'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  MessageSquare,
  Search,
  Filter,
  Loader2,
  Image as ImageIcon,
  FileText,
  User,
  Link2,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatFullName, formatDate, formatTime } from '@/lib/utils'

interface WhatsAppMessage {
  id: string
  messageId: string
  fromPhone: string
  fromName: string | null
  messageType: string
  content: string | null
  mediaId: string | null
  mediaUrl: string | null
  localFilePath: string | null
  mediaMimeType: string | null
  mediaFilename: string | null
  matchedClientId: string | null
  matchedBy: string | null
  status: string
  responseSent: boolean
  errorMessage: string | null
  processedAt: string | null
  createdAt: string
  client?: {
    id: string
    nombre: string
    apellido: string
    telefono: string
  } | null
}

interface Client {
  id: string
  nombre: string
  apellido: string
  telefono: string
}

export function WhatsAppMessages() {
  const { data: session } = useSession()
  const isEmpleadora = session?.user?.role === 'EMPLEADORA'

  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedMessage, setSelectedMessage] = useState<WhatsAppMessage | null>(null)
  const [matchDialogOpen, setMatchDialogOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [updating, setUpdating] = useState(false)

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      params.append('limit', '100')

      const response = await fetch(`/api/whatsapp/messages?${params}`)
      const result = await response.json()
      if (result.success) {
        setMessages(result.data)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  // Fetch clients for matching
  const fetchClients = useCallback(async () => {
    try {
      const response = await fetch('/api/clients?limit=1000')
      const result = await response.json()
      if (result.success) {
        setClients(result.data)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMessages()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchClients()
  }, [fetchMessages, fetchClients])

  // Manual match
  const handleMatch = useCallback(async () => {
    if (!selectedMessage || !selectedClientId) return

    setUpdating(true)
    try {
      const response = await fetch('/api/whatsapp/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: selectedMessage.id,
          clientId: selectedClientId,
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Cliente asignado correctamente')
        fetchMessages()
        setMatchDialogOpen(false)
        setSelectedMessage(null)
        setSelectedClientId('')
      } else {
        toast.error(result.error || 'Error al asignar')
      }
    } catch (error) {
      toast.error('Error al asignar cliente')
    } finally {
      setUpdating(false)
    }
  }, [selectedMessage, selectedClientId, fetchMessages])

  // Get status config
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
      received: { label: 'Recibido', color: 'bg-primary/10 text-primary', icon: Clock },
      processed: { label: 'Procesado', color: 'bg-primary/10 text-primary', icon: CheckCircle },
      error: { label: 'Error', color: 'bg-destructive/10 text-destructive', icon: XCircle },
      ignored: { label: 'Ignorado', color: 'bg-muted text-muted-foreground', icon: XCircle },
    }
    return configs[status] || configs.received
  }

  // Get message type icon
  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-4 h-4" />
      case 'document':
        return <FileText className="w-4 h-4" />
      default:
        return <MessageSquare className="w-4 h-4" />
    }
  }

  // Filter messages
  const filteredMessages = messages.filter(msg => {
    const matchesSearch =
      msg.fromPhone.includes(search) ||
      msg.fromName?.toLowerCase().includes(search.toLowerCase()) ||
      msg.content?.toLowerCase().includes(search.toLowerCase())
    return matchesSearch
  })

  if (!isEmpleadora) {
    return (
      <Card className="border-border shadow-sm">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No tienes permisos para ver esta sección</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Mensajes de WhatsApp</CardTitle>
            <CardDescription>Historial de mensajes recibidos y procesados</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por teléfono o nombre..."
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="received">Recibidos</SelectItem>
              <SelectItem value="processed">Procesados</SelectItem>
              <SelectItem value="error">Con Error</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Messages List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredMessages.length > 0 ? (
          <ScrollArea className="max-h-96">
            <div className="space-y-2 pr-4">
              {filteredMessages.map((msg) => {
                const statusConfig = getStatusConfig(msg.status)
                const StatusIcon = statusConfig.icon

                return (
                  <div
                    key={msg.id}
                    className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10 bg-primary/10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {msg.fromName?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{msg.fromName || 'Sin nombre'}</span>
                          <span className="text-xs text-muted-foreground">{msg.fromPhone}</span>
                          {getMessageTypeIcon(msg.messageType)}
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {msg.content || 'Sin contenido'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={cn(statusConfig.color, 'text-xs')}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                          {msg.matchedClientId && (
                            <Badge className="text-xs bg-secondary/10 text-primary">
                              <Link2 className="w-3 h-3 mr-1" />
                              {msg.client
                                ? formatFullName(msg.client.nombre, msg.client.apellido)
                                : 'Cliente asignado'}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDate(msg.createdAt)} {formatTime(msg.createdAt)}
                          </span>
                        </div>
                        {msg.errorMessage && (
                          <p className="text-xs text-destructive mt-1">{msg.errorMessage}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {msg.localFilePath && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(msg.localFilePath!, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                        {!msg.matchedClientId && (
                          <Dialog open={matchDialogOpen && selectedMessage?.id === msg.id} onOpenChange={(open) => {
                            setMatchDialogOpen(open)
                            if (open) setSelectedMessage(msg)
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="gap-1">
                                <Link2 className="w-3 h-3" />
                                Asignar
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Asignar a Cliente</DialogTitle>
                                <DialogDescription>
                                  Busca y selecciona el cliente para asignar este mensaje
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 mt-4">
                                <div className="p-3 bg-muted/50 rounded-lg">
                                  <p className="text-sm"><strong>De:</strong> {selectedMessage?.fromName || selectedMessage?.fromPhone}</p>
                                  <p className="text-sm"><strong>Teléfono:</strong> {selectedMessage?.fromPhone}</p>
                                </div>
                                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar cliente..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <ScrollArea className="max-h-64">
                                      {clients.map((client) => (
                                        <SelectItem key={client.id} value={client.id}>
                                          {formatFullName(client.nombre, client.apellido)} - {client.telefono}
                                        </SelectItem>
                                      ))}
                                    </ScrollArea>
                                  </SelectContent>
                                </Select>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setMatchDialogOpen(false)}>
                                    Cancelar
                                  </Button>
                                  <Button onClick={handleMatch} disabled={!selectedClientId || updating}>
                                    {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Asignar
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No hay mensajes para mostrar</p>
            <p className="text-xs text-muted-foreground mt-1">
              Los mensajes recibidos por WhatsApp aparecerán aquí
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
