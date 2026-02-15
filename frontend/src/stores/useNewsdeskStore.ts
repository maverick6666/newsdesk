import { create } from 'zustand'
import { newsdeskApi, type NewsDeskData, type ClusterDetail } from '@/services/api'

export type ViewMode = 'brief' | 'bubble' | 'signal'
export type PanelTab = 'overview' | 'flow' | 'articles'

interface NewsdeskState {
  // Data
  data: NewsDeskData | null
  selectedCluster: ClusterDetail | null
  isLoading: boolean
  error: string | null

  // View
  viewMode: ViewMode

  // Panel
  panelClusterId: number | null
  panelTab: PanelTab
  isPanelLoading: boolean

  // Filters
  activeKeyword: string | null
  showTeamOnly: boolean

  // Actions
  fetchToday: () => Promise<void>
  fetchByDate: (date: string) => Promise<void>
  fetchCluster: (id: number) => Promise<void>
  setViewMode: (mode: ViewMode) => void
  openPanel: (clusterId: number) => void
  closePanel: () => void
  setPanelTab: (tab: PanelTab) => void
  setActiveKeyword: (keyword: string | null) => void
  setShowTeamOnly: (show: boolean) => void
}

export const useNewsdeskStore = create<NewsdeskState>((set, get) => ({
  data: null,
  selectedCluster: null,
  isLoading: false,
  error: null,
  viewMode: 'brief',
  panelClusterId: null,
  panelTab: 'overview',
  isPanelLoading: false,
  activeKeyword: null,
  showTeamOnly: false,

  fetchToday: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await newsdeskApi.getToday()
      set({ data, isLoading: false })
    } catch (e) {
      set({ error: 'Failed to load data', isLoading: false })
    }
  },

  fetchByDate: async (date: string) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await newsdeskApi.getByDate(date)
      set({ data, isLoading: false })
    } catch (e) {
      set({ error: 'Failed to load data', isLoading: false })
    }
  },

  fetchCluster: async (id: number) => {
    set({ isPanelLoading: true })
    try {
      const { data } = await newsdeskApi.getCluster(id)
      set({ selectedCluster: data, isPanelLoading: false })
    } catch (e) {
      set({ error: 'Failed to load cluster', isPanelLoading: false })
    }
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  openPanel: (clusterId) => {
    set({ panelClusterId: clusterId, panelTab: 'overview', selectedCluster: null })
    get().fetchCluster(clusterId)
  },

  closePanel: () => set({ panelClusterId: null, selectedCluster: null, panelTab: 'overview' }),

  setPanelTab: (tab) => set({ panelTab: tab }),

  setActiveKeyword: (keyword) => set({ activeKeyword: keyword }),
  setShowTeamOnly: (show) => set({ showTeamOnly: show }),
}))
