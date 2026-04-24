'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, X, FileText, ImageIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ReceiptUploadDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: (invoiceId: string) => void
  clientId: string
  subscriptionId: string
  clientName: string
  periodLabel: string
}

export function ReceiptUploadDialog({ 
  open, 
  onClose, 
  onSuccess, 
  clientId, 
  subscriptionId,
  clientName,
  periodLabel
}: ReceiptUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFile(null)
      setPreviewUrl(null)
    }
  }, [open])

  const handleFile = (selectedFile: File) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Tipo de archivo no permitido. Solo PDF o imágenes.')
      return
    }
    
    setFile(selectedFile)
    
    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const onDragLeave = () => {
    setDragActive(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return
    
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('clientId', clientId)
      formData.append('subscriptionId', subscriptionId)
      formData.append('type', 'RECEIPT')
      formData.append('description', `Comprobante de transferencia - ${periodLabel}`)

      const response = await fetch('/api/invoices', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Comprobante subido correctamente')
        onSuccess(result.data.id)
      } else {
        toast.error(result.error || 'Error al subir el comprobante')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Error de conexión al subir el archivo')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !uploading && !val && onClose()}>
      <DialogContent className="sm:max-w-[450px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-primary p-6 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 bg-white/10 rounded-full blur-2xl" />
          <DialogTitle className="text-xl font-semibold relative z-10 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />
            Confirmar Transferencia
          </DialogTitle>
          <p className="text-white/70 text-sm mt-1 relative z-10">
            Sube el comprobante de pago para <strong>{clientName}</strong> ({periodLabel}).
          </p>
        </div>

        <div className="p-6 space-y-4 bg-white">
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={cn(
              "relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 flex flex-col items-center justify-center text-center gap-3",
              dragActive ? "border-secondary bg-secondary/5" : "border-border bg-muted/50",
              file ? "border-[var(--success)]/30 bg-[var(--success)]/5" : ""
            )}
          >
            {file ? (
              <div className="space-y-3 w-full flex flex-col items-center">
                {previewUrl ? (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border shadow-sm">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-[var(--destructive)]/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-8 h-8 text-[var(--destructive)]" />
                  </div>
                )}
                <div className="flex flex-col items-center">
                  <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-[var(--destructive)] hover:text-[var(--destructive)]/80 hover:bg-[var(--destructive)]/10 gap-1"
                  onClick={() => setFile(null)}
                >
                  <X className="w-3 h-3" />
                  Quitar archivo
                </Button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-primary">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Haz clic para subir o arrastra y suelta
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG o PDF (Máx. 5MB)
                  </p>
                </div>
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                />
              </>
            )}
          </div>

          <div className="bg-[var(--warning)]/10 border border-[var(--warning)]/20 p-3 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-[var(--warning)] shrink-0" />
            <p className="text-xs text-[var(--warning)]/80 leading-tight">
              <strong>Nota:</strong> Al subir el comprobante, el estado del cliente se actualizará automáticamente a "Al Día".
            </p>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button 
              variant="ghost" 
              onClick={onClose}
              disabled={uploading}
              className="h-11 rounded-xl text-muted-foreground"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={!file || uploading}
              className="h-11 flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md transition-all font-semibold"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                'Finalizar Pago'
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
