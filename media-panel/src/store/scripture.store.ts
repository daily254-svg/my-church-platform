import { create } from 'zustand'
import { socketService } from '../services/socket'
import type { BibleVersion } from '../services/scripture.service'
import type { BibleVersionMeta } from '../types/scripture.types'

interface ScriptureState {
  lastBroadcast:        { reference: string; text: string; version: string } | null
  broadcastCount:       number
  query:                string
  selectedVersion:      BibleVersion
  availableVersions:    BibleVersionMeta[]
  activityLog:          { id: string; type: string; message: string; time: string }[]

  broadcastScripture:   (reference: string, text: string, version: string) => void
  setQuery:             (query: string) => void
  setSelectedVersion:   (version: BibleVersion) => void
  setAvailableVersions: (versions: BibleVersionMeta[]) => void
}

export const useScriptureStore = create<ScriptureState>((set, get) => ({
  lastBroadcast:     null,
  broadcastCount:    0,
  query:             '',
  selectedVersion:   'kjv',
  availableVersions: [],
  activityLog:       [],

  broadcastScripture: (reference: string, text: string, version: string) => {
    // Always send version explicitly — congregation app uses it to display the version label
    const versionLabel = version || get().selectedVersion

    socketService.emitScriptureUpdate({ reference, text, version: versionLabel })

    set((state) => ({
      lastBroadcast:  { reference, text, version: versionLabel },
      broadcastCount: state.broadcastCount + 1,
      activityLog: [
        {
          id:      Date.now().toString(),
          type:    'scripture',
          message: `${reference} (${versionLabel.toUpperCase()}) broadcast to congregation`,
          time:    'Just now',
        },
        ...state.activityLog.slice(0, 9),
      ],
    }))
  },

  setQuery: (query: string) => set({ query }),

  setSelectedVersion: (version: BibleVersion) => set({ selectedVersion: version }),

  setAvailableVersions: (versions: BibleVersionMeta[]) => set({ availableVersions: versions }),
}))