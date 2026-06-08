import { useState, useEffect } from 'react'
import { type ScriptureResult, scriptureService } from '../../services/scripture.service'
import { useScriptureStore } from '../../store/scripture.store'

interface RecentScripturesProps {
  onSelect?: (scripture: ScriptureResult) => void
}

export default function RecentScriptures({ onSelect }: RecentScripturesProps) {
  const [favorites, setFavorites] = useState<ScriptureResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const selectedVersion = useScriptureStore((state) => state.selectedVersion)

  useEffect(() => {
    loadFavorites()
  }, [selectedVersion])

  const loadFavorites = async () => {
    setLoading(true)
    setError(null)
    try {
      // Load some common scriptures as favorites
      const commonReferences = [
        'Romans 8:28',
        'John 3:16',
        'Psalm 23:1',
        'Philippians 4:13',
      ]

      const results: ScriptureResult[] = []
      for (const ref of commonReferences) {
        try {
          const scripture = await scriptureService.getByReference(ref, selectedVersion)
          if (scripture && scripture.length > 0) {
            results.push(scripture[0])
          }
        } catch (err) {
          console.warn(`Failed to load ${ref}:`, err)
        }
      }

      setFavorites(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load favorites')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Recent/Favorites</h3>
      </div>

      <div className="p-4">
        {error && (
          <div className="text-red-600 text-sm mb-2">
            Error: {error}
          </div>
        )}

        {loading ? (
          <div className="text-gray-500 text-sm">Loading...</div>
        ) : favorites.length > 0 ? (
          <div className="space-y-2">
            {favorites.map((scripture, idx) => (
              <button
                key={idx}
                onClick={() => onSelect?.(scripture)}
                className="w-full text-left p-2 rounded hover:bg-gray-100 transition"
              >
                <div className="font-semibold text-sm text-blue-600">
                  {scripture.reference}
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {scripture.text}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-sm">
            No favorite scriptures yet
          </div>
        )}
      </div>
    </div>
  )
}