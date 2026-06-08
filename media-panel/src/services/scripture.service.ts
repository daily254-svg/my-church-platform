import { API_URL } from '../utils/constants'
import type { BibleVersionMeta } from '../types/scripture.types'

export type BibleVersion =
  | 'kjv'
  | 'nkjv'
  | 'amp'
  | 'niv'
  | 'esv'
  | 'nlt'
  | 'nasb1995'
  | 'csb'

export interface ScriptureResult {
  reference: string
  text: string
  book?: string
  chapter?: number
  verse?: number
  version: string
  source: 'local'
}

export const scriptureService = {
  /**
   * Fetch all versions and their availability from the backend
   */
  getVersions: async (): Promise<BibleVersionMeta[]> => {
    const response = await fetch(`${API_URL}/scripture/versions`, {
      headers: { 'Content-Type': 'application/json' },
    })
    const json = await response.json()
    if (!json.success) throw new Error(json.error || 'Failed to fetch versions')
    return json.versions as BibleVersionMeta[]
  },

  /**
   * Search scriptures by keyword or reference
   */
  search: async (
    query: string,
    version: BibleVersion = 'kjv',
    limit = 20
  ): Promise<ScriptureResult[]> => {
    const params = new URLSearchParams({
      query,
      version,
      limit: String(limit),
    })
    const response = await fetch(`${API_URL}/scripture/search?${params}`, {
      headers: { 'Content-Type': 'application/json' },
    })
    const json = await response.json()
    if (!json.success) throw new Error(json.error || 'Failed to search scriptures')
    return json.results || []
  },

  /**
   * Get a specific scripture by reference
   */
  getByReference: async (
    reference: string,
    version: BibleVersion = 'kjv'
  ): Promise<ScriptureResult[]> => {
    const params = new URLSearchParams({ reference, version })
    const response = await fetch(`${API_URL}/scripture/get?${params}`, {
      headers: { 'Content-Type': 'application/json' },
    })
    const json = await response.json()
    if (!json.success) throw new Error(json.error || 'Failed to fetch scripture')
    return json.results || []
  },

  /**
   * Compare a reference across all loaded versions
   */
  compareVersions: async (
    reference: string
  ): Promise<{ reference: string; versions: { version: string; text: string }[] } | null> => {
    const params = new URLSearchParams({ reference })
    const response = await fetch(`${API_URL}/scripture/compare?${params}`, {
      headers: { 'Content-Type': 'application/json' },
    })
    const json = await response.json()
    if (!json.success) return null
    return { reference: json.reference, versions: json.versions }
  },

  /**
   * Get all Bible books for a version
   */
  getBooks: async (version: BibleVersion = 'kjv') => {
    const params = new URLSearchParams({ version })
    const response = await fetch(`${API_URL}/scripture/books?${params}`, {
      headers: { 'Content-Type': 'application/json' },
    })
    const json = await response.json()
    if (!json.success) throw new Error(json.error || 'Failed to fetch books')
    return json.books || []
  },

  /**
   * Get verse count for a chapter
   */
  getVerseCount: async (
    book: string,
    chapter: number,
    version: BibleVersion = 'kjv'
  ): Promise<number | null> => {
    const params = new URLSearchParams({ book, chapter: String(chapter), version })
    const response = await fetch(`${API_URL}/scripture/verse-count?${params}`, {
      headers: { 'Content-Type': 'application/json' },
    })
    const json = await response.json()
    if (!json.success) return null
    return json.verseCount
  },
}