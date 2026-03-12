import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// Types
interface Client {
  id: string
  nombre: string
  apellido: string
  telefono: string
  grupoId: string | null
  grupo: { id: string; name: string; color: string } | null
  currentSubscription?: {
    status: string
    classesUsed: number
    classesTotal: number
  } | null
}

interface Group {
  id: string
  name: string
  color: string
  clientCount: number
}

interface DashboardStats {
  totalClients: number
  activeClients: number
  pendingPayments: number
  overduePayments: number
  todayAttendances: number
  monthRevenue: number
}

// Store State
interface AppState {
  // UI State
  currentView: string
  sidebarOpen: boolean
  
  // Cached Data
  clients: Client[]
  groups: Group[]
  dashboardStats: DashboardStats | null
  
  // Loading States
  clientsLoading: boolean
  groupsLoading: boolean
  dashboardLoading: boolean
  
  // Cache Timestamps
  clientsLastFetch: number
  groupsLastFetch: number
  dashboardLastFetch: number
  
  // Actions
  setCurrentView: (view: string) => void
  setSidebarOpen: (open: boolean) => void
  
  setClients: (clients: Client[]) => void
  setGroups: (groups: Group[]) => void
  setDashboardStats: (stats: DashboardStats) => void
  
  setClientsLoading: (loading: boolean) => void
  setGroupsLoading: (loading: boolean) => void
  setDashboardLoading: (loading: boolean) => void
  
  // Optimistic Updates
  updateClientOptimistic: (id: string, updates: Partial<Client>) => void
  removeClientOptimistic: (id: string) => void
  addClientOptimistic: (client: Client) => void
  
  // Invalidate Cache
  invalidateClients: () => void
  invalidateGroups: () => void
  invalidateDashboard: () => void
  
  // Reset
  reset: () => void
}

// Cache TTL (5 minutes)
const CACHE_TTL = 5 * 60 * 1000

// Initial State
const initialState = {
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
}

// Create Store
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        
        // UI Actions
        setCurrentView: (view) => set({ currentView: view }),
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        
        // Data Setters
        setClients: (clients) => set({ 
          clients, 
          clientsLastFetch: Date.now(),
          clientsLoading: false 
        }),
        setGroups: (groups) => set({ 
          groups,
          groupsLastFetch: Date.now(),
          groupsLoading: false 
        }),
        setDashboardStats: (stats) => set({ 
          dashboardStats: stats,
          dashboardLastFetch: Date.now(),
          dashboardLoading: false 
        }),
        
        // Loading Setters
        setClientsLoading: (loading) => set({ clientsLoading: loading }),
        setGroupsLoading: (loading) => set({ groupsLoading: loading }),
        setDashboardLoading: (loading) => set({ dashboardLoading: loading }),
        
        // Optimistic Updates
        updateClientOptimistic: (id, updates) => set((state) => ({
          clients: state.clients.map((c) => 
            c.id === id ? { ...c, ...updates } : c
          ),
        })),
        
        removeClientOptimistic: (id) => set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
        })),
        
        addClientOptimistic: (client) => set((state) => ({
          clients: [...state.clients, client],
        })),
        
        // Invalidate Cache
        invalidateClients: () => set({ clientsLastFetch: 0 }),
        invalidateGroups: () => set({ groupsLastFetch: 0 }),
        invalidateDashboard: () => set({ dashboardLastFetch: 0 }),
        
        // Reset
        reset: () => set(initialState),
      }),
      {
        name: 'nms-storage',
        partialize: (state) => ({
          currentView: state.currentView,
          sidebarOpen: state.sidebarOpen,
        }),
      }
    )
  )
)

// Selectors (for optimized re-renders)
export const useCurrentView = () => useAppStore((state) => state.currentView)
export const useSidebarOpen = () => useAppStore((state) => state.sidebarOpen)
export const useClients = () => useAppStore((state) => state.clients)
export const useGroups = () => useAppStore((state) => state.groups)
export const useDashboardStats = () => useAppStore((state) => state.dashboardStats)

// Cache-aware fetch hooks
export const useShouldFetchClients = () => {
  const lastFetch = useAppStore((state) => state.clientsLastFetch)
  const loading = useAppStore((state) => state.clientsLoading)
  return !loading && Date.now() - lastFetch > CACHE_TTL
}

export const useShouldFetchGroups = () => {
  const lastFetch = useAppStore((state) => state.groupsLastFetch)
  const loading = useAppStore((state) => state.groupsLoading)
  return !loading && Date.now() - lastFetch > CACHE_TTL
}

export const useShouldFetchDashboard = () => {
  const lastFetch = useAppStore((state) => state.dashboardLastFetch)
  const loading = useAppStore((state) => state.dashboardLoading)
  return !loading && Date.now() - lastFetch > CACHE_TTL
}
