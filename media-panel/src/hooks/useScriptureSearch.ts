import { useState, useEffect } from 'react'
import { useScriptureStore } from '../store/scripture.store'
import { scriptureService } from '../services/scripture.service'
import type { Scripture } from '../types/media.types'

export function useScriptureSearch() {
  const query          = useScriptureStore((state) => state.query)
  const setQuery       = useScriptureStore((state) => state.setQuery)
  const selectedVersion = useScriptureStore((state) => state.selectedVersion)

  const [results, setResults]  = useState<Scripture[]>([])
  const [loading, setLoading]  = useState(false)
  const [error, setError]      = useState<string | null>(null)

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setError(null)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const apiResults = await scriptureService.search(query, selectedVersion)

        const mapped: Scripture[] = apiResults.map((r) => ({
          id:       r.reference,
          ref:      r.reference,
          version:  r.version,
          text:     r.text,
          favorite: false,
        }))

        setResults(mapped)
      } catch (err) {
        console.error('[useScriptureSearch] Search failed:', err)
        setError(err instanceof Error ? err.message : 'Search failed')
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, selectedVersion])

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setError(null)
  }

  return { query, setQuery, results, loading, error, clearSearch }
}