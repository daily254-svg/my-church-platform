import { useEffect, useState } from 'react'
import { BookOpen, CheckCircle2, Heart, Megaphone, Radio, Users, Activity, Calendar, Shield, Lock } from 'lucide-react'
import type { Role, Screen } from '../../types/media.types'
import { ROLE_META, ROLE_SCREENS } from '../../utils/media-constants'
import { RoleBadge } from '../../components/ui/RoleBadge'
import { ACTIVITY_FEED } from '../../utils/media-data'
import { useAuthStore } from '../../store/auth.store'
import { useServiceStore } from '../../store/service.store'
import { useScriptureStore } from '../../store/scripture.store'
import { givingService } from '../../services/giving.service'

interface DashboardPageProps {
  role: Role
  liveActive: boolean
  setScreen: (screen: Screen) => void
  connectedCount: number
}

export default function DashboardPage({ role, liveActive, setScreen, connectedCount }: DashboardPageProps) {
  const canAccess = (screen: Screen) => ROLE_SCREENS[role].includes(screen)
  const meta = ROLE_META[role]
  const { user } = useAuthStore()
  const { isLive: serviceLive } = useServiceStore()
  const { lastBroadcast, broadcastCount, activityLog } = useScriptureStore()

  const [givingSummary, setGivingSummary] = useState<{
    total: number
    titheTotal: number
    offeringTotal: number
    count: number
    titheCount: number
    offeringCount: number
  } | null>(null)

  const [recentGivingRecords, setRecentGivingRecords] = useState<
    Array<{
      id: string
      user: { name: string }
      category: string
      amount: number
    }>
  >([])

  useEffect(() => {
    const canSeeGiving = role === 'Secretary' || role === 'Pastor' || role === 'Admin'
    if (!canSeeGiving) return
    givingService
      .getSummary()
      .then(setGivingSummary)
      .catch(() => {})
    givingService
      .getAll()
      .then((records) => setRecentGivingRecords(records.slice(0, 3)))
      .catch(() => {})
  }, [role])

  const isLive = serviceLive ?? liveActive
  const feedToShow = activityLog.length > 0 ? activityLog : ACTIVITY_FEED

  const statsMap = {
    Media: [
      { label: 'Service Status', value: isLive ? 'Live' : 'Offline', sub: isLive ? 'In progress' : 'Not started', icon: Radio, color: 'text-emerald-400' },
      { label: 'Connected Devices', value: connectedCount.toString(), sub: 'Congregation devices', icon: Users, color: 'text-blue-400' },
      { label: 'Sync Health', value: isLive ? '98%' : '—', sub: isLive ? 'All regions' : 'Offline', icon: Activity, color: 'text-purple-400' },
      { label: 'Scriptures Sent', value: broadcastCount.toString(), sub: 'This service', icon: BookOpen, color: 'text-amber-400' },
    ],
    Pastor: [
      { label: 'Service Status', value: isLive ? 'Live' : 'Offline', sub: isLive ? 'In progress' : 'Not started', icon: Radio, color: 'text-emerald-400' },
      { label: 'Current Sermon', value: lastBroadcast?.reference ?? '—', sub: lastBroadcast?.text?.slice(0, 30) ?? 'No scripture yet', icon: BookOpen, color: 'text-amber-400' },
      { label: 'Announcements', value: '2', sub: 'Pushed today', icon: Megaphone, color: 'text-blue-400' },
      { label: 'Total Giving', value: `Ksh${(givingSummary?.total ?? 0).toLocaleString()}`, sub: `${givingSummary?.count ?? 0} submissions`, icon: Heart, color: 'text-emerald-400' },
    ],
    Secretary: [
      { label: 'Total Giving', value: `Ksh${(givingSummary?.total ?? 0).toLocaleString()}`, sub: `${givingSummary?.count ?? 0} submissions`, icon: Heart, color: 'text-emerald-400' },
      { label: 'Submissions', value: `${givingSummary?.count ?? 0}`, sub: 'Records this service', icon: CheckCircle2, color: 'text-blue-400' },
      { label: 'Announcements', value: '2', sub: 'Sent today', icon: Megaphone, color: 'text-amber-400' },
      { label: 'Devices Online', value: connectedCount.toString(), sub: 'Congregation', icon: Users, color: 'text-purple-400' },
    ],
    Admin: [
      { label: 'Service Status', value: isLive ? 'Live' : 'Offline', sub: isLive ? 'In progress' : 'Not started', icon: Radio, color: 'text-emerald-400' },
      { label: 'Connected Devices', value: connectedCount.toString(), sub: 'Congregation devices', icon: Users, color: 'text-blue-400' },
      { label: 'Total Giving', value: `Ksh${(givingSummary?.total ?? 0).toLocaleString()}`, sub: `${givingSummary?.count ?? 0} submissions`, icon: Heart, color: 'text-amber-400' },
      { label: 'Sync Health', value: isLive ? '98%' : '—', sub: isLive ? 'All regions' : 'Offline', icon: Activity, color: 'text-purple-400' },
    ],
  }

  const actionsMap = {
    Media: [
      { label: 'Broadcast Scripture', screen: 'live' as Screen, icon: Radio, style: 'bg-blue-600/20 border-blue-500/25 text-blue-300 hover:bg-blue-600/30' },
      { label: 'Open Live Control', screen: 'live' as Screen, icon: Activity, style: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20' },
      { label: 'View Monitoring', screen: 'monitoring' as Screen, icon: Activity, style: 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10' },
    ],
    Pastor: [
      { label: 'Open Live Control', screen: 'live' as Screen, icon: Radio, style: 'bg-blue-600/20 border-blue-500/25 text-blue-300 hover:bg-blue-600/30' },
      { label: 'Manage Sermons', screen: 'sermons' as Screen, icon: BookOpen, style: 'bg-amber-500/10 border-amber-500/20 text-amber-300 hover:bg-amber-500/20' },
      { label: 'Push Announcement', screen: 'announcements' as Screen, icon: Megaphone, style: 'bg-purple-500/10 border-purple-500/20 text-purple-300 hover:bg-purple-500/20' },
      { label: 'Giving Report', screen: 'giving' as Screen, icon: Heart, style: 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10' },
    ],
    Secretary: [
      { label: 'Giving Reports', screen: 'giving' as Screen, icon: Heart, style: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20' },
      { label: 'Push Announcement', screen: 'announcements' as Screen, icon: Megaphone, style: 'bg-blue-600/20 border-blue-500/25 text-blue-300 hover:bg-blue-600/30' },
      { label: 'View Monitoring', screen: 'monitoring' as Screen, icon: Activity, style: 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10' },
    ],
    Admin: [
      { label: 'Open Live Control', screen: 'live' as Screen, icon: Radio, style: 'bg-blue-600/20 border-blue-500/25 text-blue-300 hover:bg-blue-600/30' },
      { label: 'Push Announcement', screen: 'announcements' as Screen, icon: Megaphone, style: 'bg-amber-500/10 border-amber-500/20 text-amber-300 hover:bg-amber-500/20' },
      { label: 'Giving Reports', screen: 'giving' as Screen, icon: Heart, style: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20' },
      { label: 'View Monitoring', screen: 'monitoring' as Screen, icon: Activity, style: 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10' },
    ],
  }

  const stats = statsMap[role]
  const actions = actionsMap[role]
  const recentBroadcasts = [...(lastBroadcast ? [{ ref: lastBroadcast.reference, time: 'Just now', devices: connectedCount }] : []), { ref: 'Hebrews 11:1', time: '15 min ago', devices: 211 }, { ref: 'John 3:16', time: '31 min ago', devices: 198 }].slice(0, 3)
  const upcomingServices = [
    { title: 'Sunday Morning Service', time: '8:30 AM', date: 'Today' },
    { title: 'Sunday Second Service', time: '11:00 AM', date: 'Today' },
    { title: 'Midweek Bible Study', time: '6:00 PM', date: 'Wed, Dec 11' },
  ]

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6 bg-slate-950">
      <div className="flex items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <RoleBadge role={role} />
          </div>
          <p className="text-sm text-slate-400">Welcome, {user?.name ?? 'Guest'} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        {canAccess('live') && (
          <button
            type="button"
            onClick={() => setScreen('live')}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500"
          >
            <Radio className="w-4 h-4" />
            {role === 'Media' ? 'Open Live Control' : 'Live Control'}
          </button>
        )}
      </div>

      <div className={`rounded-3xl border px-4 py-4 ${
        role === 'Admin'
          ? 'border-emerald-500/20 bg-emerald-500/10'
          : role === 'Pastor'
          ? 'border-amber-500/20 bg-amber-500/10'
          : role === 'Secretary'
          ? 'border-purple-500/20 bg-purple-500/10'
          : 'border-blue-500/20 bg-blue-500/10'
      }`}>
        <div className="flex items-center gap-3">
          {role === 'Admin' ? <Shield className={`w-4 h-4 ${meta.color}`} /> : <Lock className={`w-4 h-4 ${meta.color}`} />}
          <p className="text-sm text-slate-300">
            <span className={`font-semibold ${meta.color}`}>{meta.label} view</span>
            {' · '}You have access to: <span className="font-mono text-slate-400">{ROLE_SCREENS[role].filter((screen) => screen !== 'dashboard').map((screen) => screen.charAt(0).toUpperCase() + screen.slice(1)).join(', ')}</span>
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-4 lg:grid-cols-2">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{stat.label}</span>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className={`text-3xl font-semibold ${stat.color}`}>{stat.value}</p>
            <p className="mt-2 text-sm text-slate-500">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => setScreen(action.screen)}
                className={`${action.style} flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition`}
              >
                <action.icon className="w-4 h-4" />
                {action.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5">
          {(role === 'Media' || role === 'Pastor' || role === 'Admin') && canAccess('live') ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold">Recent Broadcasts</h2>
                <Radio className="w-4 h-4 text-slate-400" />
              </div>
              <div className="space-y-3">
                {recentBroadcasts.map((item) => (
                  <div key={item.ref} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600/15 text-blue-300">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white font-mono truncate">{item.ref}</p>
                      <p className="text-xs text-slate-500">{item.devices} devices · {item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {role === 'Secretary' ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold">Recent Giving</h2>
                <Heart className="w-4 h-4 text-slate-400" />
              </div>
              <div className="space-y-3">
                {recentGivingRecords.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600/15 text-emerald-300 font-semibold">{(item.user?.name ?? 'Unknown')[0] ?? '?'}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{item.user?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-slate-500 capitalize">{item.category.toLowerCase().replace(/_/g, ' ')}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-400">Ksh{item.amount.toLocaleString()}</span>
                  </div>
                ))}{''}
              </div>
            </div>
          ) : null}

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Upcoming Services</h2>
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-3">
              {upcomingServices.map((service) => (
                <div key={service.title} className="flex items-start gap-3">
                  <div>
                    <p className="text-xs font-mono text-amber-300">{service.time}</p>
                    <p className="text-xs text-slate-500">{service.date}</p>
                  </div>
                  <p className="text-sm text-slate-200">{service.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Activity Feed</h2>
        </div>
        <div className="space-y-3">
          {feedToShow.filter((item) => {
            if (role === 'Secretary' && item.type === 'scripture') return false
            if (role === 'Media' && item.type === 'announcement') return false
            return true
          }).map((item) => {
            const icons: Record<string, React.ComponentType<{ className?: string }>> = {
              scripture: BookOpen,
              announcement: Megaphone,
              service: Radio,
              sync: Activity,
            }
            const colors: Record<string, string> = {
              scripture: 'bg-blue-500/15 text-blue-300',
              announcement: 'bg-amber-500/15 text-amber-300',
              service: 'bg-emerald-500/15 text-emerald-300',
              sync: 'bg-purple-500/15 text-purple-300',
            }
            const Icon = icons[item.type]
            if (!Icon) return null
            return (
              <div key={item.id} className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${colors[item.type] ?? 'bg-slate-500/15 text-slate-300'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-slate-200">{item.message}</p>
                </div>
                <span className="text-xs font-mono text-slate-500">{item.time}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}