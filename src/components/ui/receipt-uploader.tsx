'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileText, Image, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

interface ReceiptUploaderProps {
  onUpload: (file: File) => Promise<{ id: string } | null>
  onRemove?: () => Promise<void>
  currentReceiptId?: string | null
  currentFileName?: string | null
  currentStatus?: string
  disabled?: boolean
  className?: string
}

export function ReceiptUploader({
  onUpload,
  onRemove,
  currentReceiptId,
  currentFileName,
  currentStatus,
  disabled = false,
  className,
}: ReceiptUploaderProps) {
  const [status, setStatus] = useState<UploadStatus>(currentReceiptId ? 'success' : 'idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setStatus('uploading')
    setProgress(0)
    setError(null)

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 20, 80))
    }, 100)

    try {
      const result = await onUpload(file)
      clearInterval(progressInterval)
      setProgress(100)
      setStatus(result ? 'success' : 'error')
      if (!result) setError('Error al subir archivo')
    } catch {
      clearInterval(progressInterval)
      setStatus('error')
      setError('Error al subir archivo')
    }
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    disabled: disabled || status === 'uploading',
  })

  const handleRemove = async () => {
    if (!onRemove) return
    setStatus('uploading')
    try {
      await onRemove()
      setStatus('idle')
      setProgress(0)
    } catch {
      setStatus('error')
      setError('Error al eliminar')
    }
  }

  const isImage = currentFileName?.match(/\.(jpg|jpeg|png|webp|gif)$/i)
  const StatusIcon = isImage ? Image : FileText

  if (currentReceiptId && status === 'success') {
    return (
      <div className={cn('flex items-center gap-3 p-3 rounded-lg border bg-muted/50', className)}>
        <div className="p-2 rounded-md bg-emerald-500/10">
          <StatusIcon className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{currentFileName || 'Comprobante'}</p>
          {currentStatus && (
            <span className={cn(
              'text-xs px-1.5 py-0.5 rounded',
              currentStatus === 'VERIFIED' && 'bg-emerald-500/10 text-emerald-600',
              currentStatus === 'PENDING' && 'bg-amber-500/10 text-amber-600',
              currentStatus === 'REJECTED' && 'bg-red-500/10 text-red-600',
            )}>
              {currentStatus === 'VERIFIED' ? 'Verificado' : currentStatus === 'PENDING' ? 'Pendiente' : 'Rechazado'}
            </span>
          )}
        </div>
        <button
          onClick={handleRemove}
          className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          disabled={disabled}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer',
        isDragActive && 'border-primary bg-primary/5',
        !isDragActive && 'border-border hover:border-primary/50 hover:bg-muted/30',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2">
        {status === 'uploading' ? (
          <>
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Subiendo... {progress}%</p>
          </>
        ) : (
          <>
            <div className="p-3 rounded-full bg-primary/10">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Adjuntar comprobante</p>
              <p className="text-xs text-muted-foreground mt-0.5">PDF, JPG, PNG (máx. 10MB)</p>
            </div>
          </>
        )}
      </div>
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </div>
  )
}
