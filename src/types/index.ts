// Domain Types for Natatory Management System

// Payment Status Enum
export type PaymentStatus = 'AL_DIA' | 'PENDIENTE' | 'DEUDOR'

// Group Types
export interface Group {
  id: string
  name: string
  color: string
  description: string | null
  schedule: string | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface GroupWithCount extends Group {
  clientCount: number
}

// Client Types
export interface Client {
  id: string
  nombre: string
  apellido: string
  dni: string | null
  telefono: string
  grupoId: string | null
  preferredDays: string | null
  preferredTime: string | null
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ClientWithGroup extends Client {
  grupo: Group | null
}

export interface ClientWithSubscription extends Client {
  grupo: Group | null
  currentSubscription?: Subscription | null
}

export interface ClientWithStats extends Client {
  grupo: Group | null
  totalClasses: number
  usedClasses: number
  status: PaymentStatus
}

// Subscription Types
export interface Subscription {
  id: string
  clientId: string
  month: number
  year: number
  status: PaymentStatus
  classesTotal: number
  classesUsed: number
  amount: number | null
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface SubscriptionWithClient extends Subscription {
  client: ClientWithGroup
}

// Invoice Types
export interface Invoice {
  id: string
  clientId: string
  imageUrl: string
  verified: boolean
  uploadedAt: Date
}

// Attendance Types
export interface Attendance {
  id: string
  clientId: string
  date: Date
  notes?: string | null
  createdAt: Date
}

export interface AttendanceWithClient extends Attendance {
  client: ClientWithGroup
}

// Dashboard Stats
export interface DashboardStats {
  totalClients: number
  activeClients: number
  pendingPayments: number
  overduePayments: number
  todayAttendances: number
  monthRevenue: number
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// Paginated Response
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// WhatsApp Webhook Types
export interface WhatsAppMessage {
  from: string
  id: string
  timestamp: string
  type: 'text' | 'image' | 'document' | 'audio' | 'video'
  text?: {
    body: string
  }
  image?: {
    id: string
    mime_type: string
    sha256: string
    caption?: string
  }
}

export interface WhatsAppWebhookPayload {
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: string
        metadata: {
          display_phone_number: string
          phone_number_id: string
        }
        contacts?: Array<{
          profile: {
            name: string
          }
          wa_id: string
        }>
        messages?: WhatsAppMessage[]
      }
      field: string
    }>
  }>
}
