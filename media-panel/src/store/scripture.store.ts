import { create } from 'zustand'
import { socketService } from '../services/socket'
import { type BibleVersion } from '../services/scripture.service'

interface ScriptureState {
  lastBroadcast:      { reference: string; text: string; version?: string } | null
  broadcastCount:     number
  query:              string
  selectedVersion:    BibleVersion
  activityLog:        { id: string; type: string; message: string; time: string }[]
  broadcastScripture: (reference: string, text: string, version?: string) => void
  setQuery:           (query: string) => void
  setSelectedVersion: (version: BibleVersion) => void
}

export const useScriptureStore = create<ScriptureState>((set, get) => ({
  lastBroadcast:   null,
  broadcastCount:  0,
  query:           '',
  selectedVersion: 'kjv',
  activityLog:     [],

  broadcastScripture: (reference: string, text: string, version?: string) => {
    const versionToSend = version || get().selectedVersion  // ← use store state
    socketService.emitScriptureUpdate({ reference, text, version: versionToSend })
    set((state) => ({
      lastBroadcast:  { reference, text, version: versionToSend },
      broadcastCount: state.broadcastCount + 1,
      activityLog: [
        { id: Date.now().toString(), type: 'scripture', message: `${reference} broadcast to congregation`, time: 'Just now' },
        ...state.activityLog.slice(0, 9)
      ],
    }))
  },

  setQuery: (query: string) => set({ query }),

  setSelectedVersion: (version: BibleVersion) => set({ selectedVersion: version }),
}))