'use client'

import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormField, FormLabel, FormControl, FormMessage, FormItem } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Check, Calendar, Clock, FileText, User, Phone, Hash, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { cn, parseArsAmount } from '@/lib/utils'
import { ScheduleSelector } from './schedule-selector'
import { createClientSchema, type CreateClientInput } from '@/schemas/client'

interface Group {
  id: string
  name: string
  color: string
}

interface Client {
  id?: string
  nombre: string
  apellido: string
  dni: string | null
  telefono: string | null
  grupoId: string | null
  preferredDays: string | null
  preferredTime: string | null
  notes: string | null
  monthlyAmount: number | null
  registrationFeePaid1: boolean
  registrationFeePaid2: boolean
  classesTotal?: number
  billingPeriod?: 'FULL' | 'HALF'
}

interface ClientFormProps {
  client?: Client | null
  groups?: Group[]
  onSuccess: () => void
  onCancel: () => void
}

export function ClientForm({ client, groups = [], onSuccess, onCancel }: ClientFormProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'schedule' | 'subscription'>('personal')
  const [additionalGroups, setAdditionalGroups] = useState<string[]>([])

  const form = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema) as any,
    defaultValues: {
      nombre: client?.nombre || '',
      apellido: client?.apellido || '',
      dni: client?.dni || undefined,
      telefono: client?.telefono || undefined,
      grupoId: client?.grupoId || undefined,
      preferredDays: client?.preferredDays || undefined,
      preferredTime: client?.preferredTime || undefined,
      notes: client?.notes || undefined,
      monthlyAmount: client?.monthlyAmount || undefined,
      registrationFeePaid1: client?.registrationFeePaid1 || false,
      registrationFeePaid2: client?.registrationFeePaid2 || false,
      classesTotal: client?.classesTotal || 4,
      billingPeriod: client?.billingPeriod || 'FULL',
    },
  })

  const watchedClassesTotal = useWatch({ control: form.control, name: 'classesTotal' }) ?? 4
  const watchedGrupoId = useWatch({ control: form.control, name: 'grupoId' })
  const watchedPreferredDays = useWatch({ control: form.control, name: 'preferredDays' }) ?? ''
  const watchedPreferredTime = useWatch({ control: form.control, name: 'preferredTime' }) ?? ''

  const toggleAdditionalGroup = (groupId: string) => {
    setAdditionalGroups(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    )
  }

  const onSubmit = async (data: CreateClientInput) => {
    try {
      const url = client?.id ? `/api/clients/${client.id}` : '/api/clients'
      const response = await fetch(url, {
        method: client?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          dni: data.dni || null,
          telefono: data.telefono || null,
          grupoId: data.grupoId || null,
          preferredDays: data.preferredDays || null,
          preferredTime: data.preferredTime || null,
          notes: data.notes || null,
        }),
      })

      const result = await response.json()

      if (result.success) {
        if (!client?.id && additionalGroups.length > 0) {
          const clientId = result.data.id
          const results = await Promise.all(
            additionalGroups.map(groupId =>
              fetch('/api/client-groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId, groupId }),
              })
            )
          )
          const failedGroups = results.filter(r => !r.ok)
          if (failedGroups.length > 0) {
            toast.error(`Error al asignar ${failedGroups.length} grupo(s)`)
          }
        }
        onSuccess()
      } else {
        toast.error(result.error || 'Error al guardar cliente')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const selectedGroupId = watchedGrupoId

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="personal" className="gap-1.5">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Datos</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-1.5">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Horario</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-1.5">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Plan</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="w-3 h-3 text-muted-foreground" />
                      Nombre *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Juan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="apellido"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido *</FormLabel>
                    <FormControl>
                      <Input placeholder="Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="dni"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Hash className="w-3 h-3 text-muted-foreground" />
                      DNI
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="12345678" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      Teléfono
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="3512345678" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Grupo Principal</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => form.setValue('grupoId', undefined, { shouldValidate: true })}
                  className={cn(
                    'px-3 py-2 text-sm rounded-xl border-2 transition-all',
                    !selectedGroupId
                      ? 'border-primary text-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  Sin grupo
                </button>
                {groups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => form.setValue('grupoId', group.id, { shouldValidate: true })}
                    className={cn(
                      'px-3 py-2 text-sm rounded-xl border-2 transition-all',
                      selectedGroupId === group.id ? 'shadow-md' : 'border-border hover:border-primary/50'
                    )}
                    style={selectedGroupId === group.id ? {
                      backgroundColor: `${group.color}15`,
                      borderColor: group.color,
                      color: group.color,
                    } : {}}
                  >
                    {group.name}
                  </button>
                ))}
              </div>
            </div>

            {!client?.id && groups.filter(g => g.id !== selectedGroupId).length > 0 && (
              <div className="space-y-2">
                <Label>Grupos Adicionales</Label>
                <p className="text-xs text-muted-foreground">Para clientes que asisten a más de un horario</p>
                <div className="flex flex-wrap gap-2">
                  {groups
                    .filter(group => group.id !== selectedGroupId)
                    .map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => toggleAdditionalGroup(group.id)}
                        className={cn(
                          'px-3 py-2 text-sm rounded-xl border-2 transition-all',
                          additionalGroups.includes(group.id) ? 'shadow-md' : 'border-border hover:border-primary/50'
                        )}
                        style={additionalGroups.includes(group.id) ? {
                          backgroundColor: `${group.color}15`,
                          borderColor: group.color,
                          color: group.color,
                        } : {}}
                      >
                        {additionalGroups.includes(group.id) && <Check className="w-3 h-3 inline mr-1" />}
                        {group.name}
                      </button>
                    ))}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="w-3 h-3 text-muted-foreground" />
                    Notas
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas sobre el cliente..."
                      className="min-h-[80px] resize-none"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="schedule" className="mt-4">
            <ScheduleSelector
              preferredDays={watchedPreferredDays}
              preferredTime={watchedPreferredTime}
              onChange={(days, time) => {
                form.setValue('preferredDays', days, { shouldValidate: true })
                form.setValue('preferredTime', time, { shouldValidate: true })
              }}
            />
          </TabsContent>

          <TabsContent value="subscription" className="mt-4 space-y-5">
            <FormField
              control={form.control}
              name="monthlyAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <DollarSign className="w-3 h-3 text-muted-foreground" />
                    Monto Mensual *
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-medium text-muted-foreground">$</span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="text-lg font-semibold h-12"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseArsAmount(e.target.value) : undefined)}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billingPeriod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    Periodo de Facturación
                  </FormLabel>
                  <FormControl>
                    <ToggleGroup
                      type="single"
                      value={field.value}
                      onValueChange={(v) => v && field.onChange(v)}
                      className="grid grid-cols-2 gap-2"
                    >
                      <ToggleGroupItem value="FULL" className="rounded-xl">
                        Mes completo
                      </ToggleGroupItem>
                      <ToggleGroupItem value="HALF" className="rounded-xl">
                        1/2 mes
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Hash className="w-3 h-3 text-muted-foreground" />
                Clases contratadas
              </Label>
              <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border-2 shrink-0 border-primary text-primary hover:bg-primary/10"
                  onClick={() => form.setValue('classesTotal', Math.max(1, watchedClassesTotal - 1), { shouldValidate: true })}
                >
                  <span className="text-lg leading-none">−</span>
                </Button>
                <div className="flex-1 text-center">
                  <span className="text-3xl font-semibold text-primary">{watchedClassesTotal}</span>
                  <span className="text-sm text-muted-foreground ml-2">clases/mes</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border-2 shrink-0 border-primary text-primary hover:bg-primary/10"
                  onClick={() => form.setValue('classesTotal', Math.min(30, watchedClassesTotal + 1), { shouldValidate: true })}
                >
                  <span className="text-lg leading-none">+</span>
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Cuotas de Inscripción</Label>
              <FormField
                control={form.control}
                name="registrationFeePaid1"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
                      <div>
                        <p className="text-sm font-medium">Cuota 1 — Inscripción ($25.000)</p>
                      </div>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label="Cuota 1 de inscripción"
                      />
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="registrationFeePaid2"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
                      <div>
                        <p className="text-sm font-medium">Cuota 2 — Inscripción ($25.000)</p>
                      </div>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label="Cuota 2 de inscripción"
                      />
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="p-3 bg-[var(--warning)]/10 rounded-lg border border-[var(--warning)]/20">
              <p className="text-xs text-[var(--warning)]">
                <Calendar className="w-3 h-3 inline mr-1" />
                Se creará una suscripción pendiente para el mes actual
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={form.formState.isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1 text-white gradient-oro-azul"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {client?.id ? 'Guardar Cambios' : 'Crear Cliente'}
          </Button>
        </div>
      </form>
    </Form>
  )
}