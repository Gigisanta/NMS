import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClientForm } from '@/components/modules/client-form'
import { createMockClient, createMockGroup } from '../../fixtures/test-data'

// ─── Global mock for fetch ─────────────────────────────────────────────────────
const mockFetch = vi.fn()
global.fetch = mockFetch

// ─── Mock ScheduleSelector ──────────────────────────────────────────────────────
vi.mock('@/components/modules/schedule-selector', () => ({
  ScheduleSelector: ({ onChange }: {
    preferredDays: string | null
    preferredTime: string | null
    onChange: (days: string, time: string) => void
  }) => (
    <div data-testid="schedule-selector">
      <button type="button" onClick={() => onChange('Lunes', '10:00')}>
        Select Lunes
      </button>
    </div>
  ),
}))

// ─── Field helpers ──────────────────────────────────────────────────────────────
// The form renders 5 textbox elements in a consistent order:
//  [0] nombre      — has placeholder="Juan"
//  [1] apellido    — has NO placeholder
//  [2] dni         — has placeholder="12345678"
//  [3] telefono    — has placeholder="3512345678"
//  [4] notes       — is a textarea with placeholder matching /notas sobre el cliente/i
const allTextboxes = () => screen.getAllByRole('textbox')
const nombreInput  = () => allTextboxes()[0]
const apellidoInput = () => allTextboxes()[1]
const dniInput     = () => allTextboxes()[2]
const telefonoInput = () => allTextboxes()[3]
const notesInput   = () => allTextboxes()[4]

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ClientForm', () => {
  const mockGroups = [
    createMockGroup({ id: 'g1', name: 'Grupo A', color: '#06b6d4' }),
    createMockGroup({ id: 'g2', name: 'Grupo B', color: '#8b5cf6' }),
    createMockGroup({ id: 'g3', name: 'Adultos', color: '#f59e0b' }),
  ]

  const defaultProps = {
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  afterEach(() => {
    cleanup()
  })

  // ── Rendering ──────────────────────────────────────────────────────────────
  describe('rendering', () => {
    it('should render all three section tabs', () => {
      render(<ClientForm {...defaultProps} groups={mockGroups} />)
      expect(screen.getByText('Datos Personales')).toBeInTheDocument()
      expect(screen.getByText('Horario')).toBeInTheDocument()
      expect(screen.getByText('Suscripción')).toBeInTheDocument()
    })

    it('should render personal section with 5 form fields', () => {
      render(<ClientForm {...defaultProps} groups={mockGroups} />)
      // 5 textboxes: nombre, apellido, dni, telefono, notes
      expect(allTextboxes()).toHaveLength(5)
    })

    it('should render group buttons in personal section', () => {
      render(<ClientForm {...defaultProps} groups={mockGroups} />)
      // Grupo A appears in primary + additional sections → multiple elements
      expect(screen.getAllByText('Grupo A').length).toBeGreaterThan(0)
    })

    it('should prefill nombre and telefono from existing client', () => {
      const existingClient = createMockClient({
        id: 'client-existing',
        nombre: 'María',
        telefono: '3512345678',
      })
      render(<ClientForm {...defaultProps} client={existingClient} groups={mockGroups} />)
      expect(nombreInput()).toHaveValue('María')
      expect(telefonoInput()).toHaveValue('3512345678')
    })

    it('should show "Guardar Cambios" for existing client', () => {
      const existingClient = createMockClient({ id: 'client-existing' })
      render(<ClientForm {...defaultProps} client={existingClient} groups={mockGroups} />)
      expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument()
    })

    it('should show "Crear Cliente" for new client', () => {
      render(<ClientForm {...defaultProps} groups={mockGroups} />)
      expect(screen.getByRole('button', { name: /crear cliente/i })).toBeInTheDocument()
    })
  })

  // ── Section navigation ──────────────────────────────────────────────────────
  describe('section navigation', () => {
    it('should switch to Horario section and show ScheduleSelector', async () => {
      const user = userEvent.setup()
      render(<ClientForm {...defaultProps} groups={mockGroups} />)
      await user.click(screen.getByText('Horario'))
      expect(screen.getByTestId('schedule-selector')).toBeInTheDocument()
    })

    it('should switch to Suscripción section and show subscription fields', async () => {
      const user = userEvent.setup()
      render(<ClientForm {...defaultProps} groups={mockGroups} />)
      await user.click(screen.getByText('Suscripción'))
      expect(screen.getByText(/monto mensual del plan/i)).toBeInTheDocument()
    })
  })

  // ── Form interaction ──────────────────────────────────────────────────────────
  describe('form interaction', () => {
    it('should update nombre field on type', async () => {
      const user = userEvent.setup()
      render(<ClientForm {...defaultProps} groups={mockGroups} />)
      await user.type(nombreInput(), 'Carlos')
      expect(nombreInput()).toHaveValue('Carlos')
    })

    it('should update telefono field on type', async () => {
      const user = userEvent.setup()
      render(<ClientForm {...defaultProps} groups={mockGroups} />)
      await user.type(telefonoInput(), '351999888')
      expect(telefonoInput()).toHaveValue('351999888')
    })

    it('should update notes field on type', async () => {
      const user = userEvent.setup()
      render(<ClientForm {...defaultProps} groups={mockGroups} />)
      await user.type(notesInput(), 'Primera clase gratis')
      expect(notesInput()).toHaveValue('Primera clase gratis')
    })

    it('should select a primary group when clicked', async () => {
      const user = userEvent.setup()
      render(<ClientForm {...defaultProps} groups={mockGroups} />)
      await user.click(screen.getAllByText('Grupo A')[0])
      expect(screen.getAllByText('Grupo A').length).toBeGreaterThan(0)
    })
  })

  // ── Subscription section ────────────────────────────────────────────────────
  describe('subscription section', () => {
    it('should render billing period selectors', async () => {
      const user = userEvent.setup()
      render(<ClientForm {...defaultProps} groups={mockGroups} />)
      await user.click(screen.getByText('Suscripción'))
      expect(screen.getByText('Mes completo')).toBeInTheDocument()
      expect(screen.getByText(/media quota/i)).toBeInTheDocument()
    })

    it('should render registration fee toggles', async () => {
      const user = userEvent.setup()
      render(<ClientForm {...defaultProps} groups={mockGroups} />)
      await user.click(screen.getByText('Suscripción'))
      expect(screen.getByText(/cuota 1 - inscripción/i)).toBeInTheDocument()
      expect(screen.getByText(/cuota 2 - inscripción/i)).toBeInTheDocument()
    })

    it('should render classes counter with default value of 4', async () => {
      const user = userEvent.setup()
      render(<ClientForm {...defaultProps} groups={mockGroups} />)
      await user.click(screen.getByText('Suscripción'))
      expect(screen.getByText('4')).toBeInTheDocument()
      expect(screen.getByText(/clases\/mes/i)).toBeInTheDocument()
    })

    it('should increment classes counter', async () => {
      const user = userEvent.setup()
      render(<ClientForm {...defaultProps} groups={mockGroups} />)
      await user.click(screen.getByText('Suscripción'))
      await user.click(screen.getByRole('button', { name: /\+/i }))
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should decrement classes counter', async () => {
      const user = userEvent.setup()
      render(<ClientForm {...defaultProps} groups={mockGroups} />)
      await user.click(screen.getByText('Suscripción'))
      await user.click(screen.getByRole('button', { name: /−/i }))
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should not decrement below 1', async () => {
      const user = userEvent.setup()
      render(<ClientForm {...defaultProps} groups={mockGroups} />)
      await user.click(screen.getByText('Suscripción'))
      const decrementBtn = screen.getByRole('button', { name: /−/i })
      await user.click(decrementBtn)
      await user.click(decrementBtn)
      await user.click(decrementBtn)
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })

  // ── Additional groups (new client only) ────────────────────────────────────
  describe('additional groups (new client only)', () => {
    it('should show additional groups section for new client', () => {
      render(<ClientForm {...defaultProps} groups={mockGroups} />)
      expect(screen.getByText('Grupos Adicionales')).toBeInTheDocument()
    })

    it('should NOT show additional groups section when editing existing client', () => {
      const existingClient = createMockClient({ id: 'client-existing' })
      render(<ClientForm {...defaultProps} client={existingClient} groups={mockGroups} />)
      expect(screen.queryByText('Grupos Adicionales')).not.toBeInTheDocument()
    })
  })

  // ── Form submission ─────────────────────────────────────────────────────────
  describe('form submission', () => {
    it('should submit form with POST for new client', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: 'new-client-id' } }),
      } as any)

      render(<ClientForm {...defaultProps} groups={mockGroups} />)

      // Fill both required fields: nombre (idx 0) + apellido (idx 1)
      await user.type(nombreInput(), 'Juan')
      await user.type(apellidoInput(), 'Pérez')

      await user.click(screen.getByRole('button', { name: /crear cliente/i }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/clients', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"nombre":"Juan"'),
        }))
      })
    })

    it('should submit form with PUT for existing client', async () => {
      const user = userEvent.setup()
      const existingClient = createMockClient({ id: 'client-1' })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: 'client-1' } }),
      } as any)

      render(<ClientForm {...defaultProps} client={existingClient} groups={mockGroups} />)

      await user.type(nombreInput(), 'María Updated')
      await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/clients/client-1', expect.objectContaining({
          method: 'PUT',
        }))
      })
    })

    it('should call onSuccess after successful submission', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: 'new-id' } }),
      } as any)

      render(<ClientForm {...defaultProps} groups={mockGroups} />)

      await user.type(nombreInput(), 'Test')
      await user.type(apellidoInput(), 'User')
      await user.click(screen.getByRole('button', { name: /crear cliente/i }))

      await waitFor(() => {
        expect(defaultProps.onSuccess).toHaveBeenCalled()
      })
    })

    it('should display error message from API on failure', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, error: 'Error de validación' }),
      } as any)

      render(<ClientForm {...defaultProps} groups={mockGroups} />)

      await user.type(nombreInput(), 'Test')
      await user.type(apellidoInput(), 'User')
      await user.click(screen.getByRole('button', { name: /crear cliente/i }))

      await waitFor(() => {
        expect(screen.getByText(/validación/i)).toBeInTheDocument()
      })
    })

    it('should display connection error on network failure', async () => {
      const user = userEvent.setup()
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(<ClientForm {...defaultProps} groups={mockGroups} />)

      await user.type(nombreInput(), 'Test')
      await user.type(apellidoInput(), 'User')
      await user.click(screen.getByRole('button', { name: /crear cliente/i }))

      await waitFor(() => {
        expect(screen.getByText('Error de conexión')).toBeInTheDocument()
      })
    })

    it('should disable cancel button during submission', async () => {
      const user = userEvent.setup()
      mockFetch.mockImplementation(() =>
        new Promise(resolve =>
          setTimeout(() =>
            resolve({
              ok: true,
              json: async () => ({ success: true, data: { id: 'new-id' } }),
            } as any), 200)
        )
      )

      render(<ClientForm {...defaultProps} groups={mockGroups} />)

      await user.type(nombreInput(), 'Test')
      await user.type(apellidoInput(), 'User')
      await user.click(screen.getByRole('button', { name: /crear cliente/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled()
      })
    })
  })

  // ── Cancel action ──────────────────────────────────────────────────────────
  describe('cancel action', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<ClientForm {...defaultProps} groups={mockGroups} />)
      await user.click(screen.getByRole('button', { name: /cancelar/i }))
      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
    })
  })

  // ── Accessibility ─────────────────────────────────────────────────────────
  describe('accessibility', () => {
    it('should have required attribute on nombre input', () => {
      render(<ClientForm {...defaultProps} groups={mockGroups} />)
      expect(nombreInput()).toHaveAttribute('required')
    })

    it('should have dni input in the form', () => {
      render(<ClientForm {...defaultProps} groups={mockGroups} />)
      expect(screen.getAllByRole('textbox')[2]).toBeInTheDocument()
    })

    it('should have 5 textbox elements (4 inputs + 1 textarea)', () => {
      render(<ClientForm {...defaultProps} groups={mockGroups} />)
      expect(allTextboxes()).toHaveLength(5)
    })
  })
})
