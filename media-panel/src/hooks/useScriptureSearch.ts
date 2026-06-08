import { useState, useEffect } from 'react'
import { useScriptureStore } from '../store/scripture.store'
import { scriptureService } from '../services/scripture.service'
import { SCRIPTURES_DB } from '../utils/media-data'
import type { Scripture } from '../types/media.types'

export function useScriptureSearch() {
  const query = useScriptureStore((state) => state.query)
  const setQuery = useScriptureStore((state) => state.setQuery)
  const selectedVersion = useScriptureStore((state) => state.selectedVersion)
  const [results, setResults] = useState<Scripture[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Clear results if query too short
    if (query.length < 2) {
      setResults([])
      return
    }

    // Debounce — wait 300ms after user stops typing
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const apiResults = await scriptureService.search(query, selectedVersion)

        // Map ScriptureResult → Scripture shape the UI expects
        const mapped: Scripture[] = apiResults.map((r) => ({
          id: r.reference,           // use reference as unique id
          ref: r.reference,          // "Genesis 1:1"
          version: r.version,
          text: r.text,
          favorite: SCRIPTURES_DB.some((s) => s.ref === r.reference && s.favorite),
        }))

        setResults(mapped)
      } catch (err) {
        console.error('[useScriptureSearch] Search failed:', err)
        // Fall back to local SCRIPTURES_DB on error
        const search = query.toLowerCase()
        const fallback = SCRIPTURES_DB
          .filter((s) => s.ref.toLowerCase().includes(search) || s.text.toLowerCase().includes(search))
          .slice(0, 5)
        setResults(fallback)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, selectedVersion])

  const clearSearch = () => {
    setQuery('')
    setResults([])
  }

  return { query, setQuery, results, loading, clearSearch }
}