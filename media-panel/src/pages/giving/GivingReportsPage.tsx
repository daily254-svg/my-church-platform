import { useEffect, useState } from 'react'
import { Download, Lock } from 'lucide-react'
import type { Role } from '../../types/media.types'
import type { GivingRecord, GivingRecordType } from '../../types/giving.types'
import { givingService } from '../../services/giving.service'
import { formatCurrencyKsh, formatDate } from '../../utils/formatters'

interface GivingReportsPageProps {
  role: Role
}

interface GivingSummary {
  total: number
  titheTotal: number
  offeringTotal: number
  count: number
  titheCount: number
  offeringCount: number
}

interface BackendGivingRecord {
  id: string
  category: string
  amount: number
  reference?: string
  note?: string
  service: string
  status: string
  createdAt: string
  user: {
    name: string | null
    email: string
  }
}

const mapCategoryToType = (category: string): GivingRecordType => {
  if (category === 'TITHE') return 'tithe'
  if (category === 'OFFERING' || category === 'THANKSGIVING' || category === 'BUILDING_FUND' || category === 'MISSION_SUPPORT' || category === 'SPECIAL_SEED') {
    return 'offering'
  }
  return 'special'
}

const mapBackendToGivingRecord = (record: BackendGivingRecord): GivingRecord => ({
  id: record.id,
  name: record.user.name || 'Anonymous',
  amount: record.amount,
  ref: record.reference || '-',
  service: record.service,
  date: record.createdAt,
  type: mapCategoryToType(record.category),
})

export default function GivingReportsPage({ role }: GivingReportsPageProps) {
  const [filter, setFilter] = useState<'all' | 'tithe' | 'offering' | 'special'>('all')
  const [search, setSearch] = useState('')
  const [records, setRecords] = useState<GivingRecord[]>([])
  const [summary, setSummary] = useState<GivingSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = async () => {
    setLoading(true)
    try {
      const filterParam = filter === 'all' ? undefined : filter === 'tithe' ? 'TITHE' : 'OFFERING'
      const [backendRecords, summaryData] = await Promise.all([
        givingService.getAll(filterParam, search || undefined),
        givingService.getSummary(),
      ])

      const mappedRecords = (backendRecords as BackendGivingRecord[]).map(mapBackendToGivingRecord)
      setRecords(mappedRecords)
      setSummary(summaryData as GivingSummary)
    } catch (error) {
      console.error('Failed to fetch giving records:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refetch()
  }, [])

  useEffect(() => {
    refetch()
  }, [filter, search])

  const filtered = records.filter((record: GivingRecord) => {
    const matchesFilter = filter === 'all' || record.type === filter
    const matchesSearch =
      !search || record.name.toLowerCase().includes(search.toLowerCase()) || record.ref.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const typeColors = {
    tithe: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
    offering: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
    special: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  }

  const isViewOnly = role === 'Pastor'

  if (loading) {
    return (
      <div className="flex-1 overflow-auto bg-slate-950 p-6 space-y-5">
        <div className="text-slate-400 text-sm p-6">Loading...</div>
      </div>
    )
  }

  const total = filtered.reduce((sum, record) => sum + record.amount, 0)

  return (
    <div className="flex-1 overflow-auto bg-slate-950 p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Giving Reports</h1>
            {isViewOnly && (
              <span className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300">
                <Lock className="w-3.5 h-3.5" />
                View Only
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">Sunday service and midweek giving submissions</p>
        </div>
        {!isViewOnly && (
          <button type="button" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10">
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          {
            label: 'Total Received',
            value: formatCurrencyKsh(summary?.total ?? 0),
            sub: `Ksh ${summary?.count ?? 0} submissions`,
          },
          {
            label: 'Tithes',
            value: formatCurrencyKsh(summary?.titheTotal ?? 0),
            sub: `Ksh ${summary?.titheCount ?? 0} members`,
          },
          {
            label: 'Offerings & Special',
            value: formatCurrencyKsh(summary?.offeringTotal ?? 0),
            sub: `Ksh ${summary?.offeringCount ?? 0} submissions`,
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-[0.25em] text-slate-500">{stat.label}</div>
            <p className="mt-3 text-3xl font-semibold text-white">{stat.value}</p>
            <p className="mt-2 text-sm text-slate-400">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {(['all', 'tithe', 'offering', 'special'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                filter === option ? 'bg-blue-600 text-white' : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full max-w-sm">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or ref…"
            className="w-full rounded-3xl border border-white/10 bg-white/5 px-12 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
          />
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-500">
            <Download className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <table className="min-w-full text-left text-sm text-slate-300">
          <thead className="border-b border-white/10 bg-slate-950/50">
            <tr>
              {['Member', 'Amount', 'Type', 'Reference', 'Service', 'Date'].map((header) => (
                <th key={header} className="px-4 py-4 uppercase tracking-[0.25em] text-slate-500">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filtered.map((record) => (
              <tr key={record.id} className="transition hover:bg-white/5">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/20 text-blue-300 font-semibold">{record.name[0]}</div>
                    <span className="text-white">{record.name}</span>
                  </div>
                </td>
                <td className="px-4 py-4 font-mono text-white">{formatCurrencyKsh(record.amount)}</td>
                <td className="px-4 py-4">
                  <span className={`rounded-2xl border px-2 py-1 text-xs font-semibold uppercase ${typeColors[record.type]}`}>{record.type}</span>
                </td>
                <td className="px-4 py-4 font-mono text-slate-400">{record.ref}</td>
                <td className="px-4 py-4 text-slate-400">{record.service}</td>
                <td className="px-4 py-4 text-slate-500 font-mono">{formatDate(record.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between gap-4 border-t border-white/10 px-4 py-4 bg-slate-950/70">
          <span className="text-xs text-slate-500">{filtered.length} records</span>
          <span className="text-sm font-semibold text-white">Total: {formatCurrencyKsh(total)}</span>
        </div>
      </div>
    </div>
  )
}