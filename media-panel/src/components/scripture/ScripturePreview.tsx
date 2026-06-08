import { type ScriptureResult } from '../../services/scripture.service'
import { useScriptureStore } from '../../store/scripture.store'

interface ScripturePreviewProps {
  scripture?: ScriptureResult | null
}

export default function ScripturePreview({ scripture }: ScripturePreviewProps) {
  const broadcastScripture = useScriptureStore((state) => state.broadcastScripture)

  if (!scripture) {
    return (
      <div className="card p-4 text-center text-gray-500">
        <p>Select a scripture to preview</p>
      </div>
    )
  }

  const handleBroadcast = () => {
    broadcastScripture(scripture.reference, scripture.text, scripture.version)
  }

  return (
    <div className="card p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-blue-600">
          {scripture.reference}
        </h3>
        <p className="text-xs text-gray-500">
          Source: {scripture.version || 'Unknown'}
        </p>
      </div>
      
      <div className="prose prose-sm max-w-none">
        <p className="text-gray-800 leading-relaxed">
          {scripture.text}
        </p>
      </div>

      <div className="mt-4 flex gap-2">
        <button className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
          Copy
        </button>
        <button className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
          Favorite
        </button>
        <button
          onClick={handleBroadcast}
          className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
        >
          Broadcast
        </button>
      </div>
    </div>
  )
}