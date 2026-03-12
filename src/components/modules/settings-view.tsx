'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  User,
  Building2,
  CreditCard,
  Bell,
  Users,
  Database,
  MessageSquare,
  Settings,
  Loader2,
} from 'lucide-react'
import { ProfileSettings } from './settings/profile-settings'
import { BusinessSettings } from './settings/business-settings'
import { PaymentSettings } from './settings/payment-settings'
import { NotificationSettings } from './settings/notification-settings'
import { UserManagement } from './settings/user-management'
import { DataSettings } from './settings/data-settings'
import { WhatsAppSettings } from './settings/whatsapp-settings'
import { WhatsAppMessages } from './settings/whatsapp-messages'

export function SettingsView() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState('profile')

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    )
  }

  const isEmpleadora = session?.user?.role === 'EMPLEADORA'

  return (
    <div className="space-y-6 p-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Settings className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Configuración</CardTitle>
              <CardDescription>
                Gestiona la configuración del sistema
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-2 h-auto p-2 bg-white rounded-lg shadow">
          <TabsTrigger value="profile" className="flex items-center gap-2 px-3 py-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Mi Perfil</span>
          </TabsTrigger>
          
          {isEmpleadora && (
            <>
              <TabsTrigger value="business" className="flex items-center gap-2 px-3 py-2">
                <Building2 className="w-4 h-4" />
                <span className="hidden sm:inline">Negocio</span>
              </TabsTrigger>
              
              <TabsTrigger value="payments" className="flex items-center gap-2 px-3 py-2">
                <CreditCard className="w-4 h-4" />
                <span className="hidden sm:inline">Pagos</span>
              </TabsTrigger>
              
              <TabsTrigger value="notifications" className="flex items-center gap-2 px-3 py-2">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Alertas</span>
              </TabsTrigger>
              
              <TabsTrigger value="users" className="flex items-center gap-2 px-3 py-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Usuarios</span>
              </TabsTrigger>
              
              <TabsTrigger value="whatsapp" className="flex items-center gap-2 px-3 py-2">
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </TabsTrigger>
              
              <TabsTrigger value="data" className="flex items-center gap-2 px-3 py-2">
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Datos</span>
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="profile" className="mt-0">
            <ProfileSettings />
          </TabsContent>

          {isEmpleadora && (
            <>
              <TabsContent value="business" className="mt-0">
                <BusinessSettings />
              </TabsContent>

              <TabsContent value="payments" className="mt-0">
                <PaymentSettings />
              </TabsContent>

              <TabsContent value="notifications" className="mt-0">
                <NotificationSettings />
              </TabsContent>

              <TabsContent value="users" className="mt-0">
                <UserManagement />
              </TabsContent>

              <TabsContent value="whatsapp" className="mt-0 space-y-6">
                <WhatsAppSettings />
                <WhatsAppMessages />
              </TabsContent>

              <TabsContent value="data" className="mt-0">
                <DataSettings />
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </div>
  )
}

export default SettingsView
