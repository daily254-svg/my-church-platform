import { create } from 'zustand'
import { socketService } from '../services/socket'
import { useAuthStore } from './auth.store'

interface DeviceRegion {
  name: string
  devices: number
  synced: number
  status: 'healthy' | 'warning' | 'error'
}

interface ServiceState {
  isLive:         boolean
  serviceId:      string
  title:          string
  startedAt:      string | null
  connectedCount: number
  syncHealth:     number
  deviceRegions:  DeviceRegion[]
  setLive:        (active: boolean) => void
  setTitle:       (title: string) => void
  startListening: () => void
  stopListening:  () => void
}

export const useServiceStore = create<ServiceState>((set, get) => ({
  isLive:         false,
  serviceId:      '',
  title:          'Sunday Morning Service',
  startedAt:      null,
  connectedCount: 0,
  syncHealth:     0,
  deviceRegions:  [
    { name: 'Main Sanctuary', devices: 0, synced: 0, status: 'healthy' },
    { name: 'Youth Hall', devices: 0, synced: 0, status: 'healthy' },
    { name: 'Overflow Room', devices: 0, synced: 0, status: 'healthy' },
    { name: 'Online Viewers', devices: 0, synced: 0, status: 'healthy' },
  ],

  setLive: (active: boolean) => {
    const user = useAuthStore.getState().user
    const payload = {
      serviceId: get().serviceId || `svc-${Date.now()}`,
      title:     get().title,
      startedBy: user?.name ?? user?.email ?? 'Unknown',
    }
    if (active) {
      socketService.emitServiceStart({ ...payload, startedAt: new Date().toISOString() })
      set({ isLive: true, serviceId: payload.serviceId, startedAt: new Date().toISOString() })
    } else {
      socketService.emitServiceEnd({ ...payload, endedAt: new Date().toISOString() })
      set({ isLive: false, startedAt: null, syncHealth: 0 })
    }
  },

  setTitle: (title: string) => set({ title }),

  startListening: () => {
    const socket = socketService.getSocket()
    if (!socket) return

    // Listen for connected device count
    socket.on("connected:count", ({ count }: { count: number }) => {
      set({ connectedCount: count })
    })

    // Listen for sync health updates
    socket.on("sync:health", ({ health, regions }: { 
      health: number
      regions: DeviceRegion[]
    }) => {
      set({ 
        syncHealth: health, 
        deviceRegions: regions 
      })
    })

    // Listen for service state sync (for late joiners)
    socket.on("sync:state", ({ serviceStatus }: { serviceStatus: string }) => {
      if (serviceStatus === 'live') {
        set({ isLive: true })
      } else if (serviceStatus === 'idle') {
        set({ isLive: false, startedAt: null })
      }
    })
  },

  stopListening: () => {
    const socket = socketService.getSocket()
    if (!socket) return

    socket.off("connected:count")
    socket.off("sync:health")
    socket.off("sync:state")
  },
}))