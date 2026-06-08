import { useState, useEffect } from 'react'
import { scriptureService, type ScriptureResult, type BibleVersion } from '../../services/scripture.service'
import { useScriptureStore } from '../../store/scripture.store'

export default function ScriptureSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ScriptureResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const selectedVersion = useScriptureStore((state) => state.selectedVersion)
  const setSelectedVersion = useScriptureStore((state) => state.setSelectedVersion)

  const versions = [
    { value: 'kjv', label: 'KJV' },
    { value: 'nkjv', label: 'NKJV' },
    { value: 'web', label: 'WEB' },
    { value: 'amp', label: 'AMP' },
    { value: 'neno', label: 'Neno' },
    { value: 'api-bible', label: 'API Bible' },
  ] as const

  const runSearch = async (q: string) => {
    if (!q.trim()) return
    setLoading(true)
    setError(null)
    try {
      const searchResults = await scriptureService.search(q, selectedVersion)
      setResults(searchResults)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    runSearch(query)
  }

  // Re-run search when version changes if there's already a query
  useEffect(() => {
    if (query.trim()) runSearch(query)
  }, [selectedVersion])

  return (
    <div className="card">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold mb-3">Search Scriptures</h3>
        
        <form onSubmit={handleSearch} className="flex gap-2 mb-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by keyword or reference (e.g., 'love' or 'John 3:16')"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        <div className="flex gap-2">
          {versions.map((v) => (
            <label key={v.value} className="flex items-center gap-2">
              <input
                type="radio"
                value={v.value}
                checked={selectedVersion === v.value}
                onChange={(e) => setSelectedVersion(e.target.value as BibleVersion)}
              />
              <span className="text-sm">{v.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="p-4">
        {error && (
          <div className="text-red-600 text-sm mb-2">
            Error: {error}
          </div>
        )}

        {results.length > 0 ? (
          <div className="space-y-3">
            {results.map((result, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="font-semibold text-sm text-blue-600 mb-1">
                  {result.reference}
                  <span className="text-xs text-gray-500 ml-2">
                    ({result.source})
                  </span>
                </div>
                <p className="text-sm text-gray-700">
                  {result.text}
                </p>
              </div>
            ))}
          </div>
        ) : !loading && query && (
          <div className="text-gray-500 text-sm">
            No results found
          </div>
        )}
      </div>
    </div>
  )
}