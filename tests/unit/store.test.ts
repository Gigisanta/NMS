import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { 
  useAppStore, 
  useCurrentView, 
  useSidebarOpen, 
  useClients, 
  useGroups,
  useShouldFetchClients,
  useShouldFetchGroups,
} from '@/store'
import { createMockClient, createMockGroup } from '../fixtures/test-data'

describe('Zustand Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useAppStore.setState({
      currentView: 'dashboard',
      sidebarOpen: true,
      clients: [],
      groups: [],
      dashboardStats: null,
      clientsLoading: false,
      groupsLoading: false,
      dashboardLoading: false,
      clientsLastFetch: 0,
      groupsLastFetch: 0,
      dashboardLastFetch: 0,
    })
  })

  describe('UI State', () => {
    it('should have initial currentView as "dashboard"', () => {
      const { result } = renderHook(() => useCurrentView())
      expect(result.current).toBe('dashboard')
    })

    it('should update currentView', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.setCurrentView('clientes')
      })
      
      expect(useAppStore.getState().currentView).toBe('clientes')
    })

    it('should have initial sidebarOpen as true', () => {
      const { result } = renderHook(() => useSidebarOpen())
      expect(result.current).toBe(true)
    })

    it('should toggle sidebarOpen', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.setSidebarOpen(false)
      })
      
      expect(useAppStore.getState().sidebarOpen).toBe(false)
    })
  })

  describe('Clients State', () => {
    it('should start with empty clients array', () => {
      const { result } = renderHook(() => useClients())
      expect(result.current).toEqual([])
    })

    it('should set clients', () => {
      const { result } = renderHook(() => useAppStore())
      const mockClients = [createMockClient(), createMockClient({ id: 'client-2' })]
      
      act(() => {
        result.current.setClients(mockClients)
      })
      
      expect(useAppStore.getState().clients).toEqual(mockClients)
      expect(useAppStore.getState().clientsLastFetch).toBeGreaterThan(0)
    })

    it('should update client optimistically', () => {
      const { result } = renderHook(() => useAppStore())
      const mockClient = createMockClient()
      
      act(() => {
        result.current.setClients([mockClient])
      })
      
      act(() => {
        result.current.updateClientOptimistic(mockClient.id, { nombre: 'Updated' })
      })
      
      const state = useAppStore.getState()
      expect(state.clients[0].nombre).toBe('Updated')
    })

    it('should remove client optimistically', () => {
      const { result } = renderHook(() => useAppStore())
      const mockClient = createMockClient()
      
      act(() => {
        result.current.setClients([mockClient])
      })
      
      act(() => {
        result.current.removeClientOptimistic(mockClient.id)
      })
      
      expect(useAppStore.getState().clients).toHaveLength(0)
    })

    it('should add client optimistically', () => {
      const { result } = renderHook(() => useAppStore())
      const mockClient = createMockClient()
      
      act(() => {
        result.current.addClientOptimistic(mockClient)
      })
      
      expect(useAppStore.getState().clients).toHaveLength(1)
    })

    it('should invalidate clients cache', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.setClients([createMockClient()])
      })
      
      expect(useAppStore.getState().clientsLastFetch).toBeGreaterThan(0)
      
      act(() => {
        result.current.invalidateClients()
      })
      
      expect(useAppStore.getState().clientsLastFetch).toBe(0)
    })
  })

  describe('Groups State', () => {
    it('should start with empty groups array', () => {
      const { result } = renderHook(() => useGroups())
      expect(result.current).toEqual([])
    })

    it('should set groups', () => {
      const { result } = renderHook(() => useAppStore())
      const mockGroups = [createMockGroup(), createMockGroup({ id: 'group-2' })]
      
      act(() => {
        result.current.setGroups(mockGroups)
      })
      
      expect(useAppStore.getState().groups).toEqual(mockGroups)
    })
  })

  describe('Loading States', () => {
    it('should set clients loading', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.setClientsLoading(true)
      })
      
      expect(useAppStore.getState().clientsLoading).toBe(true)
    })

    it('should set groups loading', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.setGroupsLoading(true)
      })
      
      expect(useAppStore.getState().groupsLoading).toBe(true)
    })

    it('should set dashboard loading', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.setDashboardLoading(true)
      })
      
      expect(useAppStore.getState().dashboardLoading).toBe(true)
    })
  })

  describe('Cache Validation', () => {
    it('should return true when clients cache is stale', () => {
      const { result } = renderHook(() => useAppStore())
      
      // Set cache timestamp to 0 (stale)
      act(() => {
        result.current.invalidateClients()
      })
      
      const { result: shouldFetch } = renderHook(() => useShouldFetchClients())
      expect(shouldFetch.current).toBe(true)
    })

    it('should return true when groups cache is stale', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.invalidateGroups()
      })
      
      const { result: shouldFetch } = renderHook(() => useShouldFetchGroups())
      expect(shouldFetch.current).toBe(true)
    })
  })

  describe('Reset', () => {
    it('should reset store to initial state', () => {
      const { result } = renderHook(() => useAppStore())
      
      // Make some changes
      act(() => {
        result.current.setCurrentView('clientes')
        result.current.setSidebarOpen(false)
        result.current.setClients([createMockClient()])
        result.current.setGroups([createMockGroup()])
      })
      
      // Reset
      act(() => {
        result.current.reset()
      })
      
      const state = useAppStore.getState()
      expect(state.currentView).toBe('dashboard')
      expect(state.sidebarOpen).toBe(true)
      expect(state.clients).toEqual([])
      expect(state.groups).toEqual([])
    })
  })
})
