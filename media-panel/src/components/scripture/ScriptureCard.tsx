import type { ScriptureResult } from '../../services/scripture.service'

interface ScriptureCardProps {
  scripture:    ScriptureResult
  onRemove?:    () => void
  onBroadcast?: () => void
}

export default function ScriptureCard({ scripture, onRemove, onBroadcast }: ScriptureCardProps) {
  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-blue-600">{scripture.reference}</h4>
          <span className="text-xs font-mono text-gray-400">
            {scripture.version ?? 'Unknown'}
          </span>
        </div>
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-red-600 text-lg leading-none"
          aria-label="Remove"
        >
          ×
        </button>
      </div>

      <p className="text-sm text-gray-700 mb-3 line-clamp-3">{scripture.text}</p>

      <div className="flex gap-2">
        <button
          onClick={onBroadcast}
          className="flex-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
        >
          Broadcast
        </button>
        <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition">
          Edit
        </button>
      </div>
    </div>
  )
}