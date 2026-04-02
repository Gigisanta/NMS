import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/auth/login-form'

// Mock next-auth/react
const mockSignIn = vi.fn()
vi.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
  useSession: vi.fn(() => ({ data: null, status: 'unauthenticated' })),
}))

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// Mock window.location
const originalLocation = window.location
beforeEach(() => {
  Object.defineProperty(window, 'location', {
    value: { href: 'http://localhost/' },
    writable: true,
  })
})
afterEach(() => {
  Object.defineProperty(window, 'location', { value: originalLocation, writable: true })
})

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  afterEach(() => {
    cleanup()
  })

  describe('rendering', () => {
    it('should render login form with all required fields', () => {
      render(<LoginForm />)

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /iniciar sesi[óo]n/i })).toBeInTheDocument()
    })

    it('should render title and subtitle', () => {
      render(<LoginForm />)

      expect(screen.getByText('Bienvenido')).toBeInTheDocument()
      expect(screen.getByText('Sistema de Gestión de Natatorio')).toBeInTheDocument()
    })

    it('should render register link', () => {
      render(<LoginForm />)
      const link = screen.getByRole('link', { name: /registrarse/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/register')
    })
  })

  describe('user interaction', () => {
    it('should update email field on change', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'mariela@nms.com')
      expect(emailInput).toHaveValue('mariela@nms.com')
    })

    it('should update password field on change', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const passwordInput = screen.getByLabelText(/contraseña/i)
      await user.type(passwordInput, 'secret123')
      expect(passwordInput).toHaveValue('secret123')
    })

    it('should submit form with email and password', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValueOnce({ error: null, ok: true })

      render(<LoginForm />)

      await user.type(screen.getByLabelText(/email/i), 'mariela@nms.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'secret123')
      await user.click(screen.getByRole('button', { name: /iniciar sesi[óo]n/i }))

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          email: 'mariela@nms.com',
          password: 'secret123',
          redirect: false,
        })
      })
    })

    it('should navigate to callbackUrl on successful login', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValueOnce({ error: null, ok: true })

      render(<LoginForm callbackUrl="/dashboard" />)

      await user.type(screen.getByLabelText(/email/i), 'test@test.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'pass')
      await user.click(screen.getByRole('button', { name: /iniciar sesi[óo]n/i }))

      await waitFor(() => {
        expect(window.location.href).toBe('/dashboard')
      })
    })
  })

  describe('loading state', () => {
    it('should disable fields during submission', async () => {
      const user = userEvent.setup()
      mockSignIn.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ error: null, ok: true }), 200))
      )

      render(<LoginForm />)

      await user.type(screen.getByLabelText(/email/i), 'mariela@nms.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'secret123')

      // Click submit — button becomes disabled immediately
      await user.click(screen.getByRole('button', { name: /iniciar sesi[óo]n/i }))

      // Both inputs should be disabled after clicking submit
      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeDisabled()
        expect(screen.getByLabelText(/contraseña/i)).toBeDisabled()
      })
    })
  })

  describe('error handling', () => {
    it('should display error message on invalid credentials', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValueOnce({ error: 'Credenciales inválidas', ok: false })

      render(<LoginForm />)

      await user.type(screen.getByLabelText(/email/i), 'bad@email.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'wrongpass')
      await user.click(screen.getByRole('button', { name: /iniciar sesi[óo]n/i }))

      await waitFor(() => {
        expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument()
      })
    })

    it('should display generic error when result is not ok', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValueOnce({ error: null, ok: false })

      render(<LoginForm />)

      await user.type(screen.getByLabelText(/email/i), 'test@test.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'pass')
      await user.click(screen.getByRole('button', { name: /iniciar sesi[óo]n/i }))

      await waitFor(() => {
        expect(screen.getByText(/error al iniciar sesi[óo]n/i)).toBeInTheDocument()
      })
    })

    it('should NOT clear error when user starts typing again (form only clears on submit)', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValueOnce({ error: 'Credenciales inválidas', ok: false })

      render(<LoginForm />)

      await user.type(screen.getByLabelText(/email/i), 'bad@email.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'wrong')
      await user.click(screen.getByRole('button', { name: /iniciar sesi[óo]n/i }))

      await waitFor(() => {
        expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument()
      })

      // Error persists when typing — form only clears error at next submit
      await user.type(screen.getByLabelText(/email/i), 'good@email.com')
      expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have email and password inputs with proper types', () => {
      render(<LoginForm />)

      expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email')
      expect(screen.getByLabelText(/contraseña/i)).toHaveAttribute('type', 'password')
    })

    it('should have a submit button with type submit', () => {
      render(<LoginForm />)
      const button = screen.getByRole('button', { name: /iniciar sesi[óo]n/i })
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('should have link to register page with correct href', () => {
      render(<LoginForm />)
      const link = screen.getByRole('link', { name: /registrarse/i })
      expect(link).toHaveAttribute('href', '/register')
    })
  })
})
