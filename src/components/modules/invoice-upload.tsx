'use client'

import { useState, useCallback, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  FileText,
  Upload,
  Trash2,
  Eye,
  Loader2,
  FileIcon,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  Calendar,
  FileCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { queryClient } from '@/lib/queryClient'

interface Invoice {
  id: string
  fileName: string
  filePath: string
  fileSize: number | null
  mimeType: string
  invoiceNumber: string | null
  amount: number | null
  currency: string
  issueDate: string | null
  dueDate: string | null
  type: string
  category: string | null
  description: string | null
  verified: boolean
  status: string
  source: string
  uploadedAt: string
}

interface InvoiceUploadProps {
  clientId: string
  invoices: Invoice[]
  onInvoiceChange: () => void
}

// Invoice type labels
const INVOICE_TYPES: Record<string, string> = {
  PAYMENT: 'Pago',
  RECEIPT: 'Recibo',
  INVOICE: 'Factura',
  OTHER: 'Otro',
}

// Status config
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  VERIFIED: { label: 'Verificado', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  REJECTED: { label: 'Rechazado', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
}

// Memoized invoice item
const InvoiceItem = memo(function InvoiceItem({
  invoice,
  onDelete,
  onStatusChange,
  onView,
}: {
  invoice: Invoice
  onDelete: () => void
  onStatusChange: (status: string, verified: boolean) => void
  onView: () => void
}) {
  const statusConfig = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.PENDING
  const StatusIcon = statusConfig.icon
  const isPdf = invoice.mimeType === 'application/pdf'
  const isImage = invoice.mimeType.startsWith('image/')

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group">
      {/* File icon */}
      <div className={cn(
        'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
        isPdf ? 'bg-red-100' : isImage ? 'bg-blue-100' : 'bg-gray-100'
      )}>
        {isPdf ? (
          <FileText className="w-5 h-5 text-red-600" />
        ) : isImage ? (
          <ImageIcon className="w-5 h-5 text-blue-600" />
        ) : (
          <FileIcon className="w-5 h-5 text-gray-600" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{invoice.fileName}</p>
          {invoice.invoiceNumber && (
            <span className="text-xs text-slate-500">#{invoice.invoiceNumber}</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
          <span>{INVOICE_TYPES[invoice.type] || invoice.type}</span>
          {invoice.amount && (
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {invoice.amount.toLocaleString('es-AR')} {invoice.currency}
            </span>
          )}
          {invoice.issueDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(invoice.issueDate), 'dd/MM/yy', { locale: es })}
            </span>
          )}
          {invoice.fileSize && (
            <span>{formatFileSize(invoice.fileSize)}</span>
          )}
        </div>
      </div>

      {/* Status badge */}
      <Badge className={cn(statusConfig.color, 'border shrink-0')}>
        <StatusIcon className="w-3 h-3 mr-1" />
        {statusConfig.label}
      </Badge>

      {/* Actions — always visible on touch, fade-in on hover for desktop */}
      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onView}
        >
          <Eye className="w-4 h-4" />
        </Button>
        {invoice.status === 'PENDING' && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-green-600 hover:text-green-700"
            onClick={() => onStatusChange('VERIFIED', true)}
          >
            <FileCheck className="w-4 h-4" />
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar factura?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El archivo será eliminado permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
})

export function InvoiceUpload({ clientId, invoices, onInvoiceChange }: InvoiceUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    file: null as File | null,
    invoiceNumber: '',
    amount: '',
    issueDate: '',
    dueDate: '',
    type: 'PAYMENT',
    category: '',
    description: '',
  })

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, file }))
    }
  }, [])

  const handleUpload = useCallback(async () => {
    if (!formData.file && !formData.invoiceNumber && !formData.amount) {
      return
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('clientId', clientId)
      if (formData.file) {
        fd.append('file', formData.file)
      }
      if (formData.invoiceNumber) {
        fd.append('invoiceNumber', formData.invoiceNumber)
      }
      if (formData.amount) {
        fd.append('amount', formData.amount)
      }
      if (formData.issueDate) {
        fd.append('issueDate', formData.issueDate)
      }
      if (formData.dueDate) {
        fd.append('dueDate', formData.dueDate)
      }
      fd.append('type', formData.type)
      if (formData.category) {
        fd.append('category', formData.category)
      }
      if (formData.description) {
        fd.append('description', formData.description)
      }

      const response = await fetch('/api/invoices', {
        method: 'POST',
        body: fd,
      })

      const result = await response.json()

      if (result.success) {
        // Reset form
        setFormData({
          file: null,
          invoiceNumber: '',
          amount: '',
          issueDate: '',
          dueDate: '',
          type: 'PAYMENT',
          category: '',
          description: '',
        })
        setDialogOpen(false)
        onInvoiceChange()
        // Invalidar caché de TanStack Query para actualizar dashboard instantáneamente
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      } else {
        console.error('Error uploading invoice:', result.error)
        setError(result.error || 'Error al subir la factura')
      }
    } catch (error) {
      console.error('Error uploading invoice:', error)
      setError(error instanceof Error ? error.message : 'Error al subir la factura')
    } finally {
      setUploading(false)
    }
  }, [clientId, formData, onInvoiceChange])

  const handleDelete = useCallback(async (invoiceId: string) => {
    setDeleting(invoiceId)
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        onInvoiceChange()
        // Invalidar caché de TanStack Query para actualizar dashboard instantáneamente
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      }
    } catch (error) {
      console.error('Error deleting invoice:', error)
    } finally {
      setDeleting(null)
    }
  }, [onInvoiceChange])

  const handleStatusChange = useCallback(async (invoiceId: string, status: string, verified: boolean) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, verified }),
      })

      const result = await response.json()

      if (result.success) {
        onInvoiceChange()
        // Invalidar caché de TanStack Query para actualizar dashboard instantáneamente
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      }
    } catch (error) {
      console.error('Error updating invoice:', error)
    }
  }, [onInvoiceChange])

  const handleView = useCallback((invoice: Invoice) => {
    // Open file from database via API
    window.open(`/api/invoices/${invoice.id}/file`, '_blank')
  }, [])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Facturas y Comprobantes</h3>
          <p className="text-sm text-slate-500">
            {invoices.length} archivo{invoices.length !== 1 ? 's' : ''} cargado{invoices.length !== 1 ? 's' : ''}
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (open) setError(null); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 text-white" style={{ background: '#005691' }}>
              <Upload className="w-4 h-4" />
              Subir Factura
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Subir Factura o Comprobante</DialogTitle>
              <DialogDescription>
                Sube archivos PDF o imágenes de facturas, recibos o comprobantes de pago.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* File upload */}
              <div className="space-y-2">
                <Label>Archivo (PDF o imagen)</Label>
                <Input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileChange}
                />
                {formData.file && (
                  <p className="text-xs text-slate-500">
                    {formData.file.name} ({(formData.file.size / 1024).toFixed(1)} KB)
                  </p>
                )}
                {error && (
                  <p className="text-sm text-red-500 mt-2 p-2 bg-red-50 rounded">{error}</p>
                )}
              </div>

              {/* Invoice number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Número de Comprobante</Label>
                  <Input
                    placeholder="Ej: 0001-00012345"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monto</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAYMENT">Pago</SelectItem>
                    <SelectItem value="RECEIPT">Recibo</SelectItem>
                    <SelectItem value="INVOICE">Factura</SelectItem>
                    <SelectItem value="OTHER">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Fecha de Emisión</Label>
                  <Input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de Vencimiento</Label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Descripción / Notas</Label>
                <Input
                  placeholder="Notas adicionales..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {/* Submit */}
              <Button
                onClick={handleUpload}
                disabled={uploading || (!formData.file && !formData.invoiceNumber && !formData.amount)}
                className="w-full text-white"
                style={{ background: '#005691' }}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Archivo
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Invoice list */}
      {invoices.length > 0 ? (
        <ScrollArea className="max-h-96">
          <div className="space-y-2 pr-4">
            {invoices.map((invoice) => (
              <InvoiceItem
                key={invoice.id}
                invoice={invoice}
                onDelete={() => handleDelete(invoice.id)}
                onStatusChange={(status, verified) => handleStatusChange(invoice.id, status, verified)}
                onView={() => handleView(invoice)}
              />
            ))}
          </div>
        </ScrollArea>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Sin facturas cargadas</p>
            <p className="text-xs text-slate-400 mt-1">
              Haz clic en "Subir Factura" para agregar
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
