'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { Database, Download, Upload, RefreshCw, Trash2, Loader2, ExternalLink, Copy, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export function DataSettings() {
  const { data: session } = useSession()
  const isEmpleadora = session?.user?.role === 'EMPLEADORA'
  const [exporting, setExporting] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleExport = useCallback(async () => {
    setExporting(true)
    try {
      // Fetch all data
      const [clientsRes, groupsRes, invoicesRes] = await Promise.all([
        fetch('/api/clients?limit=1000'),
        fetch('/api/groups'),
        fetch('/api/invoices?limit=1000'),
      ])

      const [clients, groups, invoices] = await Promise.all([
        clientsRes.json(),
        groupsRes.json(),
        invoicesRes.json(),
      ])

      const exportData = {
        exportedAt: new Date().toISOString(),
        exportedBy: session?.user?.email,
        clients: clients.data || [],
        groups: groups.data || [],
        invoices: invoices.data || [],
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nms-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Datos exportados correctamente')
    } catch (error) {
      toast.error('Error al exportar datos')
    } finally {
      setExporting(false)
    }
  }, [session])

  const handleResetSettings = useCallback(async () => {
    setResetting(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Configuración restablecida a valores por defecto')
        window.location.reload()
      } else {
        toast.error(result.error || 'Error al restablecer')
      }
    } catch (error) {
      toast.error('Error al restablecer configuración')
    } finally {
      setResetting(false)
    }
  }, [])

  const copyWebhookUrl = useCallback(() => {
    const url = `${window.location.origin}/api/webhook/whatsapp`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('URL copiada al portapapeles')
  }, [])

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
    <div className="space-y-6">
      {/* Data Export */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10">
              <Database className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <CardTitle className="text-lg">Datos y Respaldo</CardTitle>
              <CardDescription>Exporta y gestiona los datos del sistema</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">Exportar Datos</p>
              <p className="text-sm text-muted-foreground">Descarga todos los datos en formato JSON</p>
            </div>
            <Button onClick={handleExport} disabled={exporting} className="gap-2">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Exportar
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">Importar Datos</p>
              <p className="text-sm text-muted-foreground">Restaura datos desde un archivo de respaldo</p>
            </div>
            <Button variant="outline" disabled className="gap-2">
              <Upload className="w-4 h-4" />
              Importar
            </Button>
            <p className="text-xs text-muted-foreground ml-2">Próximamente</p>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp Integration */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ExternalLink className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Integración WhatsApp</CardTitle>
              <CardDescription>Webhook para recibir comprobantes automáticamente</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">URL del Webhook</Label>
            <div className="flex gap-2">
              <code className="flex-1 p-3 bg-muted rounded-lg text-sm text-muted-foreground break-all">
                {typeof window !== 'undefined' ? `${window.location.origin}/api/webhook/whatsapp` : '/api/webhook/whatsapp'}
              </code>
              <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
                {copied ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">Estado de la Integración</p>
              <p className="text-sm text-muted-foreground">Verificar en Meta Business Suite</p>
            </div>
            <Badge variant="outline" className="text-[var(--warning)] border-[var(--warning)]/20">
              Pendiente
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Configura este URL en tu WhatsApp Business API para recibir comprobantes de pago automáticamente.
            Los clientes podrán enviar fotos de sus comprobantes y el sistema los procesará.
          </p>
        </CardContent>
      </Card>

      {/* System Reset */}
      <Card className="border-destructive/20 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-lg text-destructive">Zona de Peligro</CardTitle>
              <CardDescription>Acciones irreversibles del sistema</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-destructive/5 rounded-lg border border-destructive/20">
            <div>
              <p className="font-medium text-destructive">Restablecer Configuración</p>
              <p className="text-sm text-destructive/80">Volver a los valores por defecto</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/5">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Restablecer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Restablecer configuración?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Todos los ajustes volverán a sus valores por defecto. Esta acción no afecta los datos de clientes ni pagos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetSettings} disabled={resetting}>
                    {resetting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Restablecer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Import Label component
import { Label } from '@/components/ui/label'
