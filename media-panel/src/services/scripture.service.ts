import { API_URL } from '../utils/constants'

export type BibleVersion = 'kjv' | 'nkjv' | 'web' | 'amp' | 'neno' | 'api-bible'

export interface ScriptureResult {
  reference: string
  text: string
  book?: string
  chapter?: number
  verse?: number
  source: 'local' | 'api-bible'
  version?: string
}

export const scriptureService = {
  /**
   * Search for scriptures
   */
  search: async (query: string, version: BibleVersion = 'kjv'): Promise<ScriptureResult[]> => {
    const response = await fetch(`${API_URL}/scripture/search?query=${encodeURIComponent(query)}&version=${version}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const json = await response.json()

    if (!json.success) {
      throw new Error(json.error || 'Failed to search scriptures')
    }

    return json.results || []
  },

  /**
   * Get a specific scripture by reference
   */
  getByReference: async (reference: string, version: BibleVersion = 'kjv'): Promise<ScriptureResult[]> => {
    const response = await fetch(`${API_URL}/scripture/get?reference=${encodeURIComponent(reference)}&version=${version}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const json = await response.json()

    if (!json.success) {
      throw new Error(json.error || 'Failed to fetch scripture')
    }

    return json.results || []
  },

  /**
   * Get all Bible books
   */
  getBooks: async () => {
    const response = await fetch(`${API_URL}/scripture/books`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const json = await response.json()

    if (!json.success) {
      throw new Error(json.error || 'Failed to fetch books')
    }

    return json.books || []
  },
}