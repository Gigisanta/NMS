// Test data factories
export const createMockClient = (overrides = {}) => ({
  id: 'client-1',
  nombre: 'Juan',
  apellido: 'Pérez',
  dni: '12345678',
  telefono: '+5491122334455',
  grupoId: null,
  preferredDays: 'Lunes,Miércoles',
  preferredTime: '10:00',
  notes: null,
  createdAt: new Date('2024-01-15'),
  grupo: null,
  ...overrides,
})

export const createMockGroup = (overrides = {}) => ({
  id: 'group-1',
  name: 'Grupo A',
  color: '#06b6d4',
  description: 'Niños principiantes',
  schedule: 'Lunes y Miércoles 10:00',
  active: true,
  createdAt: new Date('2024-01-01'),
  clientCount: 5,
  ...overrides,
})

export const createMockSubscription = (overrides = {}) => ({
  id: 'sub-1',
  clientId: 'client-1',
  month: 2,
  year: 2026,
  status: 'PENDIENTE',
  classesTotal: 4,
  classesUsed: 0,
  amount: 5000,
  notes: null,
  createdAt: new Date('2024-02-01'),
  updatedAt: new Date('2024-02-01'),
  ...overrides,
})

export const createMockAttendance = (overrides = {}) => ({
  id: 'attendance-1',
  clientId: 'client-1',
  date: new Date(),
  notes: null,
  ...overrides,
})

export const createMockInvoice = (overrides = {}) => ({
  id: 'invoice-1',
  subscriptionId: 'sub-1',
  amount: 5000,
  status: 'PENDIENTE',
  paymentMethod: null,
  receiptImage: null,
  whatsappMessageId: null,
  createdAt: new Date(),
  ...overrides,
})

export const createMockDashboardStats = () => ({
  totalClients: 27,
  activeClients: 22,
  pendingPayments: 5,
  overduePayments: 2,
  todayAttendances: 10,
  monthRevenue: 85000,
})

// Arrays of test data
export const mockClients = [
  createMockClient({ id: 'client-1', nombre: 'Juan', apellido: 'Pérez' }),
  createMockClient({ id: 'client-2', nombre: 'María', apellido: 'García' }),
  createMockClient({ id: 'client-3', nombre: 'Carlos', apellido: 'López' }),
]

export const mockGroups = [
  createMockGroup({ id: 'group-1', name: 'Grupo A', color: '#06b6d4' }),
  createMockGroup({ id: 'group-2', name: 'Grupo B', color: '#8b5cf6' }),
  createMockGroup({ id: 'group-3', name: 'Adultos', color: '#f59e0b' }),
]
