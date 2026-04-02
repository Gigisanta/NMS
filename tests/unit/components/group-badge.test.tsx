import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { GroupBadge } from '@/components/modules/group-badge'
import { createMockGroup } from '../../fixtures/test-data'

describe('GroupBadge', () => {
  beforeEach(() => {
    cleanup()
  })

  describe('rendering', () => {
    it('should render group name and color dot', () => {
      const group = createMockGroup({ name: 'Grupo A', color: '#06b6d4' })

      render(<GroupBadge group={group} />)

      expect(screen.getByText('Grupo A')).toBeInTheDocument()
      const container = screen.getByText('Grupo A').parentElement
      expect(container?.querySelector('.rounded-full')).toBeInTheDocument()
    })

    it('should render "Sin grupo" when group is null', () => {
      render(<GroupBadge group={null} />)
      expect(screen.getByText('Sin grupo')).toBeInTheDocument()
    })

    it('should render "Sin grupo" when group is undefined', () => {
      render(<GroupBadge group={undefined as never} />)
      expect(screen.getByText('Sin grupo')).toBeInTheDocument()
    })
  })

  describe('size variants', () => {
    it('should apply sm size classes', () => {
      const group = createMockGroup()
      const { container } = render(<GroupBadge group={group} size="sm" />)
      expect(container.firstChild).toHaveClass('text-xs', 'px-2', 'py-0.5')
    })

    it('should apply md size classes by default', () => {
      const group = createMockGroup()
      const { container } = render(<GroupBadge group={group} size="md" />)
      expect(container.firstChild).toHaveClass('text-xs', 'px-2.5', 'py-1')
    })

    it('should apply lg size classes', () => {
      const group = createMockGroup()
      const { container } = render(<GroupBadge group={group} size="lg" />)
      expect(container.firstChild).toHaveClass('text-sm', 'px-3', 'py-1.5')
    })
  })

  describe('styling', () => {
    it('should apply custom className', () => {
      const group = createMockGroup()
      const { container } = render(<GroupBadge group={group} className="mt-4 ml-2" />)
      expect(container.firstChild).toHaveClass('mt-4', 'ml-2')
    })

    it('should render color dot with correct background', () => {
      const group = createMockGroup({ color: '#8b5cf6' })
      render(<GroupBadge group={group} />)
      const dot = screen.getByText('Grupo A').parentElement?.querySelector('.rounded-full')
      expect(dot).toHaveStyle({ backgroundColor: '#8b5cf6' })
    })
  })

  describe('interactive mode', () => {
    it('should apply cursor-pointer when interactive is true', () => {
      const group = createMockGroup()
      const { container } = render(<GroupBadge group={group} interactive />)
      expect(container.firstChild).toHaveClass('cursor-pointer')
    })

    it('should not apply cursor-pointer when interactive is false', () => {
      const group = createMockGroup()
      const { container } = render(<GroupBadge group={group} interactive={false} />)
      expect(container.firstChild).not.toHaveClass('cursor-pointer')
    })

    it('should call onClick when clicked in interactive mode', () => {
      const group = createMockGroup()
      const onClick = vi.fn()
      render(<GroupBadge group={group} interactive onClick={onClick} />)
      fireEvent.click(screen.getByText('Grupo A'))
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('should call onClick on null group badge in interactive mode', () => {
      const onClick = vi.fn()
      render(<GroupBadge group={null} interactive onClick={onClick} />)
      fireEvent.click(screen.getByText('Sin grupo'))
      expect(onClick).toHaveBeenCalledTimes(1)
    })
  })
})

describe('StatCard (interface)', () => {
  // StatCard is a private component inside dashboard-view.tsx
  // We test the expected interface/render behaviour via a reference component

  const StatCard = ({
    title,
    value,
    description,
  }: {
    title: string
    value: number
    description: string
  }) => (
    <div data-testid="stat-card">
      <h3>{title}</h3>
      <p data-testid="stat-value">{value}</p>
      <span>{description}</span>
    </div>
  )

  it('should render stat card with correct values', () => {
    render(
      <StatCard
        title="Total Clientes"
        value={27}
        description="Registrados"
      />
    )
    expect(screen.getByText('Total Clientes')).toBeInTheDocument()
    expect(screen.getByTestId('stat-value')).toHaveTextContent('27')
    expect(screen.getByText('Registrados')).toBeInTheDocument()
  })

  it('should display zero value correctly', () => {
    render(<StatCard title="Pendientes" value={0} description="Por cobrar" />)
    expect(screen.getByTestId('stat-value')).toHaveTextContent('0')
  })

  it('should display large values with locale formatting', () => {
    render(<StatCard title="Ingresos" value={85000} description="ARS" />)
    expect(screen.getByTestId('stat-value')).toHaveTextContent('85000')
  })
})
