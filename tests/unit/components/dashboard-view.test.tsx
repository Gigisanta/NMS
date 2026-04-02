import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DashboardView } from '@/components/modules/dashboard-view'
import { createMockDashboardStats } from '../../fixtures/test-data'

// ─── Module-level mocks (reconfigurable per test) ─────────────────────────────
const mockUseSession = vi.fn()
const mockUseQuery = vi.fn()

vi.mock('next-auth/react', () => ({
  useSession: (...args: unknown[]) => mockUseSession(...args),
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}))

vi.mock('@/store', () => ({
  useAppStore: vi.fn(() => vi.fn()),
}))

// Note: @/components/modules/group-badge and @/components/modules/time-clock-widget
// cannot be reliably mocked with vi.mock() in this test setup.
// The real components are used instead. Testing focuses on:
//   - Stat cards rendering from useQuery mock data
//   - Navigation behavior
//   - Loading/error states
//   - Role-based view differences

// ─── Test data ───────────────────────────────────────────────────────────────
const mockDashboardData = {
  stats: createMockDashboardStats(),
  recentClients: [
    { id: 'rc1', nombre: 'Juan', apellido: 'Pérez', telefono: '+549111', grupo: { id: 'g1', name: 'Grupo A', color: '#06b6d4' }, createdAt: '2024-01-15' },
    { id: 'rc2', nombre: 'María', apellido: 'García', telefono: '+549222', grupo: null, createdAt: '2024-01-14' },
  ],
  pendingClients: [
    { client: { id: 'pc1', nombre: 'Carlos', apellido: 'López', telefono: '+549333', grupo: { id: 'g2', name: 'Grupo B', color: '#8b5cf6' } }, status: 'PENDIENTE' },
  ],
  currentMonth: 4,
  currentYear: 2026,
  groupRevenue: [
    { id: 'g1', name: 'Grupo A', color: '#06b6d4', clientCount: 10, revenue: 50000, collected: 35000 },
    { id: 'g2', name: 'Grupo B', color: '#8b5cf6', clientCount: 7, revenue: 35000, collected: 20000 },
  ],
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('DashboardView', () => {
  const mockNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  afterEach(() => {
    cleanup()
  })

  describe('loading state', () => {
    it('should show loading skeleton while fetching data', () => {
      mockUseSession.mockReturnValueOnce({ data: { user: { role: 'EMPLEADORA' } }, status: 'authenticated' })
      mockUseQuery.mockReturnValueOnce({ data: undefined, isLoading: true, error: null })

      const { container } = render(<DashboardView onNavigate={mockNavigate} />)

      // DashboardSkeleton renders Skeleton divs with rounded class
      expect(container.querySelector('[class*="rounded"]')).toBeTruthy()
    })
  })

  describe('admin view (EMPLEADORA)', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({ data: { user: { role: 'EMPLEADORA' } }, status: 'authenticated' })
      mockUseQuery.mockReturnValue({ data: mockDashboardData, isLoading: false, error: null })
    })

    it('should render dashboard title', () => {
      render(<DashboardView onNavigate={mockNavigate} />)
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    it('should render stat card values from API data', () => {
      render(<DashboardView onNavigate={mockNavigate} />)

      expect(screen.getByText('27')).toBeInTheDocument()  // totalClients
      expect(screen.getByText('22')).toBeInTheDocument()  // activeClients
      expect(screen.getByText('5')).toBeInTheDocument()  // pendingPayments
      expect(screen.getByText('10')).toBeInTheDocument()  // todayAttendances
    })

    it('should render stat card labels', () => {
      render(<DashboardView onNavigate={mockNavigate} />)

      expect(screen.getByText('Clientes')).toBeInTheDocument()
      expect(screen.getByText('Activos')).toBeInTheDocument()
      expect(screen.getByText('Hoy')).toBeInTheDocument()
    })

    it('should render recent clients with names visible', () => {
      render(<DashboardView onNavigate={mockNavigate} />)

      expect(screen.getByText('Recientes')).toBeInTheDocument()
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
      expect(screen.getByText('María García')).toBeInTheDocument()
    })

    it('should render revenue section', () => {
      render(<DashboardView onNavigate={mockNavigate} />)
      expect(screen.getByText(/ingresos del mes/i)).toBeInTheDocument()
    })

    it('should render "Ver Clientes" navigation button', () => {
      render(<DashboardView onNavigate={mockNavigate} />)
      expect(screen.getByRole('button', { name: /ver clientes/i })).toBeInTheDocument()
    })

    it('should navigate to clientes when "Ver Clientes" is clicked', async () => {
      const user = userEvent.setup()
      render(<DashboardView onNavigate={mockNavigate} />)

      await user.click(screen.getByRole('button', { name: /ver clientes/i }))
      expect(mockNavigate).toHaveBeenCalledWith('clientes')
    })

    it('should render empty state when no recent clients', () => {
      mockUseQuery.mockReturnValue({ data: { ...mockDashboardData, recentClients: [] }, isLoading: false, error: null })
      render(<DashboardView onNavigate={mockNavigate} />)
      expect(screen.getByText(/aún no hay clientes registrados/i)).toBeInTheDocument()
    })

    it('should render "Todo al día" when no pending clients', () => {
      mockUseQuery.mockReturnValue({ data: { ...mockDashboardData, pendingClients: [] }, isLoading: false, error: null })
      render(<DashboardView onNavigate={mockNavigate} />)
      expect(screen.getByText(/todo al día/i)).toBeInTheDocument()
    })

    it('should show "Ver todos" button when more than 5 pending clients', () => {
      mockUseQuery.mockReturnValue({
        data: {
          ...mockDashboardData,
          pendingClients: Array.from({ length: 8 }, (_, i) => ({
            client: { id: `pc${i}`, nombre: `Cliente${i}`, apellido: 'T', telefono: '+549111', grupo: null },
            status: 'PENDIENTE',
          })),
        },
        isLoading: false,
        error: null,
      })
      render(<DashboardView onNavigate={mockNavigate} />)
      expect(screen.getByRole('button', { name: /ver todos \(8\)/i })).toBeInTheDocument()
    })

    it('should navigate to pagos when "Ver todos" is clicked', async () => {
      const user = userEvent.setup()
      mockUseQuery.mockReturnValue({
        data: {
          ...mockDashboardData,
          pendingClients: Array.from({ length: 8 }, (_, i) => ({
            client: { id: `pc${i}`, nombre: `Cliente${i}`, apellido: 'T', telefono: '+549111', grupo: null },
            status: 'PENDIENTE',
          })),
        },
        isLoading: false,
        error: null,
      })
      render(<DashboardView onNavigate={mockNavigate} />)
      await user.click(screen.getByRole('button', { name: /ver todos \(8\)/i }))
      expect(mockNavigate).toHaveBeenCalledWith('pagos')
    })
  })

  describe('employee view (EMPLEADO)', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({ data: { user: { role: 'EMPLEADO' } }, status: 'authenticated' })
      mockUseQuery.mockReturnValue({ data: mockDashboardData, isLoading: false, error: null })
    })

    it('should show pending payments card for employees', () => {
      render(<DashboardView onNavigate={mockNavigate} />)
      expect(screen.getByText(/pagos pendientes/i)).toBeInTheDocument()
    })

    it('should not render revenue section for employees', () => {
      render(<DashboardView onNavigate={mockNavigate} />)
      expect(screen.queryByText(/ingresos del mes/i)).not.toBeInTheDocument()
    })
  })

  describe('data fetching', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({ data: { user: { role: 'EMPLEADORA' } }, status: 'authenticated' })
      mockUseQuery.mockReturnValue({ data: mockDashboardData, isLoading: false, error: null })
    })

    it('should call useQuery with dashboard query key', () => {
      render(<DashboardView onNavigate={mockNavigate} />)
      expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({
        queryKey: ['dashboard'],
      }))
    })
  })

  describe('error state', () => {
    it('should return empty container when data is undefined and not loading', () => {
      mockUseSession.mockReturnValue({ data: { user: { role: 'EMPLEADORA' } }, status: 'authenticated' })
      mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, error: null })

      const { container } = render(<DashboardView onNavigate={mockNavigate} />)
      expect(container).toBeEmptyDOMElement()
    })
  })

  describe('navigation', () => {
    it('should call navigate callback when button is clicked', async () => {
      const user = userEvent.setup()
      mockUseSession.mockReturnValue({ data: { user: { role: 'EMPLEADORA' } }, status: 'authenticated' })
      mockUseQuery.mockReturnValue({ data: mockDashboardData, isLoading: false, error: null })

      render(<DashboardView onNavigate={mockNavigate} />)
      await user.click(screen.getByRole('button', { name: /ver clientes/i }))
      expect(mockNavigate).toHaveBeenCalledTimes(1)
    })
  })
})
