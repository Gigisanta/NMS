'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  MessageSquare,
  Settings,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  RefreshCw,
  TestTube,
  Link2,
  Bell,
  Download,
  Users,
  DollarSign,
  HelpCircle,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface WhatsAppConfig {
  id: string
  accessToken: string | null
  phoneNumberId: string | null
  verifyToken: string | null
  businessAccountId: string | null
  webhookUrl: string | null
  isActive: boolean
  autoReplyEnabled: boolean
  autoDownloadMedia: boolean
  autoMatchClients: boolean
  autoUpdatePayment: boolean
  welcomeMessage: string | null
  successMessage: string | null
  notFoundMessage: string | null
  errorMessage: string | null
}

export function WhatsAppSettings() {
  const { data: session } = useSession()
  const isEmpleadora = session?.user?.role === 'EMPLEADORA'

  const [config, setConfig] = useState<WhatsAppConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    accessToken: '',
    phoneNumberId: '',
    verifyToken: '',
    businessAccountId: '',
    isActive: false,
    autoReplyEnabled: true,
    autoDownloadMedia: true,
    autoMatchClients: true,
    autoUpdatePayment: true,
    welcomeMessage: '',
    successMessage: '',
    notFoundMessage: '',
    errorMessage: '',
  })

  // Fetch config
  const fetchConfig = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/whatsapp/config')
      const result = await response.json()
      if (result.success) {
        setConfig(result.data)
        setFormData({
          accessToken: result.data.accessToken || '',
          phoneNumberId: result.data.phoneNumberId || '',
          verifyToken: result.data.verifyToken || '',
          businessAccountId: result.data.businessAccountId || '',
          isActive: result.data.isActive || false,
          autoReplyEnabled: result.data.autoReplyEnabled ?? true,
          autoDownloadMedia: result.data.autoDownloadMedia ?? true,
          autoMatchClients: result.data.autoMatchClients ?? true,
          autoUpdatePayment: result.data.autoUpdatePayment ?? true,
          welcomeMessage: result.data.welcomeMessage || '',
          successMessage: result.data.successMessage || '',
          notFoundMessage: result.data.notFoundMessage || '',
          errorMessage: result.data.errorMessage || '',
        })
      }
    } catch (error) {
      console.error('Error fetching WhatsApp config:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConfig()
  }, [fetchConfig])

  // Save config
  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/whatsapp/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()
      if (result.success) {
        setConfig(result.data)
        toast.success('Configuración guardada')
      } else {
        toast.error(result.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }, [formData])

  // Test connection
  const handleTest = useCallback(async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const response = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'testConnection' }),
      })

      const result = await response.json()
      setTestResult({
        success: result.success,
        message: result.success ? result.message : result.error,
      })
    } catch (error) {
      setTestResult({ success: false, message: 'Error de conexión' })
    } finally {
      setTesting(false)
    }
  }, [])

  // Generate new verify token
  const handleGenerateToken = useCallback(async () => {
    try {
      const response = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generateToken' }),
      })

      const result = await response.json()
      if (result.success) {
        setFormData(prev => ({ ...prev, verifyToken: result.data.verifyToken }))
        toast.success('Token generado')
      }
    } catch (error) {
      toast.error('Error al generar token')
    }
  }, [])

  // Copy to clipboard
  const copyToClipboard = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
    toast.success('Copiado al portapapeles')
  }, [])

  const webhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/webhook/whatsapp`
    : '/api/webhook/whatsapp'

  if (!isEmpleadora) {
    return (
      <Card className="border-border shadow-sm">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No tienes permisos para ver esta sección</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-secondary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Integración WhatsApp</CardTitle>
                <CardDescription>Recibe comprobantes automáticamente por WhatsApp</CardDescription>
              </div>
            </div>
            <Badge className={config?.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}>
              {config?.isActive ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">Estado de la Integración</p>
              <p className="text-sm text-muted-foreground">
                {config?.isActive 
                  ? 'Los mensajes se procesan automáticamente'
                  : 'La integración está desactivada'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label>{formData.isActive ? 'Activo' : 'Inactivo'}</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Tabs */}
      <Tabs defaultValue="connection" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="connection" className="gap-2">
            <Link2 className="w-4 h-4" />
            Conexión
          </TabsTrigger>
          <TabsTrigger value="automation" className="gap-2">
            <Settings className="w-4 h-4" />
            Automatización
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-2">
            <Send className="w-4 h-4" />
            Mensajes
          </TabsTrigger>
          <TabsTrigger value="help" className="gap-2">
            <HelpCircle className="w-4 h-4" />
            Ayuda
          </TabsTrigger>
        </TabsList>

        {/* Connection Tab */}
        <TabsContent value="connection" className="space-y-4 mt-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Credenciales de WhatsApp Business API</CardTitle>
              <CardDescription>
                Configura las credenciales de tu cuenta de WhatsApp Business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Access Token</Label>
                <Input
                  type="password"
                  value={formData.accessToken}
                  onChange={(e) => setFormData(prev => ({ ...prev, accessToken: e.target.value }))}
                  placeholder="EAAxxxxxxxx..."
                />
                <p className="text-xs text-muted-foreground">
                  Obtén tu token en Meta Business Suite {'>'} WhatsApp {'>'} Configuración de la API
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Phone Number ID</Label>
                  <Input
                    value={formData.phoneNumberId}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumberId: e.target.value }))}
                    placeholder="123456789012345"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Business Account ID</Label>
                  <Input
                    value={formData.businessAccountId}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessAccountId: e.target.value }))}
                    placeholder="123456789012345"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleTest} disabled={testing} variant="outline" className="gap-2">
                  {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                  Probar Conexión
                </Button>
                {testResult && (
                  <Badge className={testResult.success ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}>
                    {testResult.success ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    {testResult.success ? 'Conectado' : 'Error'}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Webhook Configuration */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Configuración del Webhook</CardTitle>
              <CardDescription>
                Configura este webhook en Meta Business Suite
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>URL del Webhook</Label>
                <div className="flex gap-2">
                  <Input value={webhookUrl} readOnly className="bg-muted/50" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(webhookUrl, 'webhook')}
                  >
                    {copied === 'webhook' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Token de Verificación</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.verifyToken}
                    onChange={(e) => setFormData(prev => ({ ...prev, verifyToken: e.target.value }))}
                    placeholder="Token para verificar el webhook"
                  />
                  <Button variant="outline" onClick={handleGenerateToken} className="shrink-0">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Usa este token cuando configures el webhook en Meta Business Suite
                </p>
              </div>

              <div className="p-4 bg-[var(--warning)]/5 border border-[var(--warning)]/20 rounded-lg">
                <p className="text-sm font-medium text-[var(--warning)]">Pasos para configurar:</p>
                <ol className="text-sm text-[var(--warning)]/80 mt-2 space-y-1 list-decimal list-inside">
                  <li>Ve a Meta Business Suite</li>
                  <li>Navega a WhatsApp {'>'} Configuración de la API</li>
                  <li>Configura el webhook con la URL de arriba</li>
                  <li>Usa el token de verificación para confirmar</li>
                  <li>Suscríbete a los eventos: messages, messaging_postbacks</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-4 mt-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Automatizaciones</CardTitle>
              <CardDescription>
                Configura qué acciones realizar automáticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Respuestas Automáticas</p>
                    <p className="text-sm text-muted-foreground">Enviar confirmación al recibir mensajes</p>
                  </div>
                </div>
                <Switch
                  checked={formData.autoReplyEnabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoReplyEnabled: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-secondary" />
                  <div>
                    <p className="font-medium">Descargar Archivos</p>
                    <p className="text-sm text-muted-foreground">Descargar automáticamente fotos y documentos</p>
                  </div>
                </div>
                <Switch
                  checked={formData.autoDownloadMedia}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoDownloadMedia: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Matchear Clientes</p>
                    <p className="text-sm text-muted-foreground">Identificar clientes por número de teléfono</p>
                  </div>
                </div>
                <Switch
                  checked={formData.autoMatchClients}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoMatchClients: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-[var(--warning)]" />
                  <div>
                    <p className="font-medium">Actualizar Pagos</p>
                    <p className="text-sm text-muted-foreground">Marcar como pagado al recibir comprobante</p>
                  </div>
                </div>
                <Switch
                  checked={formData.autoUpdatePayment}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoUpdatePayment: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4 mt-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Personalizar Mensajes</CardTitle>
              <CardDescription>
                Configura los mensajes automáticos que se envían
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mensaje de Bienvenida</Label>
                <Textarea
                  value={formData.welcomeMessage}
                  onChange={(e) => setFormData(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                  placeholder="Mensaje que se envía cuando un cliente escribe..."
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">
                  Variables: {`{businessName}`}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Mensaje de Confirmación de Pago</Label>
                <Textarea
                  value={formData.successMessage}
                  onChange={(e) => setFormData(prev => ({ ...prev, successMessage: e.target.value }))}
                  placeholder="Mensaje cuando el pago se procesa correctamente..."
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">
                  Variables: {`{clientName}`}, {`{date}`}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Mensaje de Cliente No Encontrado</Label>
                <Textarea
                  value={formData.notFoundMessage}
                  onChange={(e) => setFormData(prev => ({ ...prev, notFoundMessage: e.target.value }))}
                  placeholder="Mensaje cuando no se encuentra el cliente..."
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">
                  Variables: {`{contactName}`}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Mensaje de Error</Label>
                <Textarea
                  value={formData.errorMessage}
                  onChange={(e) => setFormData(prev => ({ ...prev, errorMessage: e.target.value }))}
                  placeholder="Mensaje cuando hay un error..."
                  className="min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Help Tab */}
        <TabsContent value="help" className="space-y-4 mt-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Guía de Configuración</CardTitle>
              <CardDescription>
                Pasos para configurar la integración con WhatsApp Business API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-sm text-white font-semibold bg-primary">1</span>
                    Crear Cuenta de WhatsApp Business
                  </h4>
                  <p className="text-sm text-muted-foreground mt-2 ml-8">
                    Ve a <a href="https://business.facebook.com" target="_blank" className="hover:underline font-medium text-primary">Meta Business Suite</a> y crea una cuenta comercial si no tienes una.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-sm text-white font-semibold bg-primary">2</span>
                    Configurar WhatsApp Business API
                  </h4>
                  <p className="text-sm text-muted-foreground mt-2 ml-8">
                    En Meta Business Suite, ve a WhatsApp {'>'} Configuración de la API y configura tu número de teléfono.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-sm text-white font-semibold bg-primary">3</span>
                    Obtener Credenciales
                  </h4>
                  <ul className="text-sm text-muted-foreground mt-2 ml-8 space-y-1 list-disc list-inside">
                    <li>Access Token: Token de acceso permanente</li>
                    <li>Phone Number ID: ID de tu número de WhatsApp Business</li>
                    <li>Business Account ID: ID de tu cuenta comercial</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-sm text-white font-semibold bg-primary">4</span>
                    Configurar Webhook
                  </h4>
                  <ul className="text-sm text-muted-foreground mt-2 ml-8 space-y-1 list-disc list-inside">
                    <li>Copia la URL del webhook</li>
                    <li>Genera o define un token de verificación</li>
                    <li>En Meta Business Suite, configura el webhook</li>
                    <li>Suscríbete a los eventos: <code className="bg-muted px-1 rounded">messages</code></li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-sm text-white font-semibold bg-primary">5</span>
                    Probar Integración
                  </h4>
                  <p className="text-sm text-muted-foreground mt-2 ml-8">
                    Envía un mensaje a tu número de WhatsApp Business y verifica que aparezca en el sistema.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-muted/50 border border-border rounded-lg">
                <h4 className="font-medium text-foreground">💡 Tips</h4>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>Los clientes se matchean automáticamente por número de teléfono</li>
                  <li>Asegúrate de que los números en el sistema coincidan con WhatsApp</li>
                  <li>Los comprobantes se guardan en la carpeta uploads</li>
                  <li>Puedes revisar todos los mensajes en la pestaña "Mensajes"</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
          Guardar Configuración
        </Button>
      </div>
    </div>
  )
}
