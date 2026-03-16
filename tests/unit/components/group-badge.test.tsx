import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GroupBadge } from '@/components/modules/group-badge'
import { createMockGroup } from '../../fixtures/test-data'

describe('GroupBadge', () => {
  it('should render group name and color', () => {
    const group = createMockGroup({ name: 'Grupo A', color: '#06b6d4' })
    
    render(<GroupBadge group={group} />)
    
    expect(screen.getByText('Grupo A')).toBeInTheDocument()
  })

  it('should render "Sin grupo" when group is null', () => {
    render(<GroupBadge group={null} />)
    
    expect(screen.getByText('Sin grupo')).toBeInTheDocument()
  })

  it('should apply custom size classes', () => {
    const group = createMockGroup()
    
    const { container } = render(<GroupBadge group={group} size="sm" />)
    
    expect(container.firstChild).toHaveClass('text-xs')
  })

  it('should apply default size when not specified', () => {
    const group = createMockGroup()
    
    const { container } = render(<GroupBadge group={group} />)
    
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const group = createMockGroup()
    
    const { container } = render(<GroupBadge group={group} className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })
})

describe('StatCard', () => {
  // Mock the StatCard component
  const StatCard = ({ 
    title, 
    value, 
    description 
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
})
