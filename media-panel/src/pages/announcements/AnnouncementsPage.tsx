import { useState, useEffect } from 'react'
import { CheckCircle2, Clock, Trash2, Send, Calendar, Palette, AlertTriangle, Users } from 'lucide-react'
import type { Role } from '../../types/media.types'
import { announcementService } from '../../services/announcement.service'
import { eventService } from '../../services/event.service'
import { categoryColors } from '../../utils/media-constants'

interface AnnouncementsPageProps {
  role: Role
}

interface Announcement {
  id: string
  title: string
  body: string
  category: string
  isLive: boolean
  scheduledAt?: string
  sentAt?: string
  createdAt: string
}

interface Event {
  id: string
  title: string
  date: string
  time: string
  type: string
  accent: string
  acceptRegistration?: boolean
  registrationTitle?: string | null
  registrationDescription?: string | null
  registrationFields?: Array<{
    key: string
    label: string
    type: 'text' | 'email' | 'tel' | 'textarea' | 'number'
    required: boolean
    placeholder?: string
  }>
  registrations?: Array<{
    id: string
    answers: Record<string, string | number | boolean | null>
    createdAt: string
    user?: {
      id: string
      name?: string | null
      email?: string | null
      phone?: string | null
    } | null
  }>
  createdAt: string
}

export default function AnnouncementsPage({ role }: AnnouncementsPageProps) {
  // ── Announcements state ─────────────────────────────
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState<string>('GENERAL')
  const [scheduled, setScheduled] = useState('')
  const [sending, setSending] = useState(false)

  // ── Events state ────────────────────────────────────
  const [events, setEvents] = useState<Event[]>([])
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventType, setEventType] = useState('')
  const [eventAccent, setEventAccent] = useState('#1B3A7A')
  const [acceptRegistration, setAcceptRegistration] = useState(false)
  const [registrationTitle, setRegistrationTitle] = useState('')
  const [registrationDescription, setRegistrationDescription] = useState('')
  const [registrationFields, setRegistrationFields] = useState<Array<{
    key: string
    label: string
    type: 'text' | 'email' | 'tel' | 'textarea' | 'number'
    required: boolean
    placeholder?: string
  }>>([])
  const [eventCreating, setEventCreating] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [deletingPastEvents, setDeletingPastEvents] = useState(false)
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)

  const categories = ['GENERAL', 'EVENT', 'EMERGENCY', 'PRAYER', 'OFFERING']
  const accentPresets = ['#1B3A7A', '#C4933A', '#2D7A6A', '#6B3A7A', '#EF4444']
  const canCompose = role === 'Pastor' || role === 'Admin' || role === 'Secretary'

  // ── Refs for scroll containers ──────────────────────

  // Fetch announcements and events on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError('')
        const [announcementData, eventData] = await Promise.all([
          announcementService.getAll(),
          eventService.getAll(),
        ])
        setAnnouncements(announcementData)
        setEvents(eventData)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load data'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Auto-delete past events on load and periodically
  useEffect(() => {
    const deletePastEvents = async () => {
      const now = new Date()
      const pastEvents = events.filter(event => {
        const eventDateTime = new Date(`${event.date}T${event.time}`)
        return eventDateTime < now
      })

      if (pastEvents.length > 0) {
        setDeletingPastEvents(true)
        try {
          await Promise.all(
            pastEvents.map(event => eventService.delete(event.id))
          )
          // Refetch events after deletion
          const updatedEvents = await eventService.getAll()
          setEvents(updatedEvents)
        } catch (err) {
          console.error('Failed to auto-delete past events:', err)
        } finally {
          setDeletingPastEvents(false)
        }
      }
    }

    if (events.length > 0) {
      deletePastEvents()
    }
  }, [events.length]) // Run when events are loaded

  const pushAnnouncement = async () => {
    if (!title || !body) return
    setSending(true)
    try {
      await announcementService.create({
        title,
        body,
        category,
        scheduledAt: scheduled || undefined,
      })
      // Refetch to get the full list
      const data = await announcementService.getAll()
      setAnnouncements(data)
      // Clear form
      setTitle('')
      setBody('')
      setScheduled('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create announcement'
      alert(message)
    } finally {
      setSending(false)
    }
  }

  const handleSend = async (id: string) => {
    try {
      await announcementService.send(id)
      // Refetch to get updated list
      const data = await announcementService.getAll()
      setAnnouncements(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send announcement'
      alert(message)
    }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await announcementService.delete(id)
      // Refetch to get updated list
      const data = await announcementService.getAll()
      setAnnouncements(data)
      setShowDeleteConfirm(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete announcement'
      alert(message)
    }
  }

  // ── Event handlers ──────────────────────────────────
  const createEvent = async () => {
    if (!eventTitle || !eventDate || !eventTime || !eventType) return
    setEventCreating(true)
    try {
      await eventService.create({
        title: eventTitle,
        date: eventDate,
        time: eventTime,
        type: eventType,
        accent: eventAccent,
        acceptRegistration,
        registrationTitle: registrationTitle || null,
        registrationDescription: registrationDescription || null,
        registrationFields,
      })
      // Refetch to get the full list
      const data = await eventService.getAll()
      setEvents(data)
      // Clear form
      setEventTitle('')
      setEventDate('')
      setEventTime('')
      setEventType('')
      setEventAccent('#1B3A7A')
      setAcceptRegistration(false)
      setRegistrationTitle('')
      setRegistrationDescription('')
      setRegistrationFields([])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create event'
      alert(message)
    } finally {
      setEventCreating(false)
    }
  }

  const handleDeleteEvent = async (id: string) => {
    try {
      await eventService.delete(id)
      // Refetch to get updated list
      const data = await eventService.getAll()
      setEvents(data)
      setShowDeleteConfirm(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete event'
      alert(message)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCategory = (cat: string): string => {
    return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase()
  }

  const getCategoryColor = (cat: string): string => {
    const formatted = formatCategory(cat)
    return categoryColors[formatted] || 'bg-slate-500/15 text-slate-400 border-slate-500/20'
  }

  const isPastEvent = (event: Event): boolean => {
    const eventDateTime = new Date(`${event.date}T${event.time}`)
    return eventDateTime < new Date()
  }

  const addRegistrationField = () => {
    setRegistrationFields((prev) => [
      ...prev,
      {
        key: `field_${Date.now()}`,
        label: 'New Field',
        type: 'text',
        required: false,
        placeholder: '',
      },
    ])
  }

  const updateRegistrationField = (index: number, updates: Partial<(typeof registrationFields)[number]>) => {
    setRegistrationFields((prev) => prev.map((field, fieldIndex) => fieldIndex === index ? { ...field, ...updates } : field))
  }

  const removeRegistrationField = (index: number) => {
    setRegistrationFields((prev) => prev.filter((_, fieldIndex) => fieldIndex !== index))
  }

  // ── Loading state ──────────────────────────────────────
  if (loading) {
    return (
      <div className="h-full w-full bg-slate-950 p-6 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-950">
      <div className="p-6 space-y-5 min-h-full">
        <div>
          <h1 className="text-2xl font-semibold">Announcements & Events</h1>
          <p className="text-sm text-slate-400 mt-1">Compose and push live announcements to the congregation</p>
        </div>

        {/* ── Error message ─────────────────────────────── */}
        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* ── Announcements Compose form ────────────────── */}
        {canCompose && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">New Announcement</h2>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`rounded-2xl px-3 py-2 text-xs font-medium transition ${
                    category === item
                      ? getCategoryColor(item)
                      : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {formatCategory(item)}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Announcement title"
                className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
              />
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Write the announcement message for the congregation…"
                rows={4}
                className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <input
                    type="datetime-local"
                    value={scheduled}
                    onChange={(event) => setScheduled(event.target.value)}
                    className="w-full bg-transparent text-sm text-white outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={pushAnnouncement}
                  disabled={!title || !body || sending}
                  className="inline-flex items-center gap-2 rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'Creating…' : 'Create Announcement'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Events Compose form ───────────────────────── */}
        {canCompose && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">New Event</h2>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Event title"
                  className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                />
                <input
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  placeholder="Event type (e.g. Service, Fellowship)"
                  className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-transparent text-sm text-white outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full bg-transparent text-sm text-white outline-none"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="inline-flex items-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10 transition"
                  >
                    <Palette className="w-4 h-4" />
                    <div
                      className="w-4 h-4 rounded-full border border-white/20"
                      style={{ backgroundColor: eventAccent }}
                    />
                    Accent Color
                  </button>
                  {showColorPicker && (
                    <div className="absolute top-full left-0 mt-2 rounded-2xl border border-white/10 bg-slate-900 p-3 flex gap-2 z-10">
                      {accentPresets.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            setEventAccent(color)
                            setShowColorPicker(false)
                          }}
                          className={`w-8 h-8 rounded-full border-2 transition ${
                            eventAccent === color ? 'border-white' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={createEvent}
                  disabled={!eventTitle || !eventDate || !eventTime || !eventType || eventCreating}
                  className="inline-flex items-center gap-2 rounded-3xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {eventCreating ? 'Creating…' : 'Create Event'}
                </button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 space-y-3">
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={acceptRegistration}
                    onChange={(e) => setAcceptRegistration(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-transparent"
                  />
                  Accept registrations for this event
                </label>

                {acceptRegistration && (
                  <div className="space-y-3">
                    <input
                      value={registrationTitle}
                      onChange={(e) => setRegistrationTitle(e.target.value)}
                      placeholder="Registration title"
                      className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                    />
                    <textarea
                      value={registrationDescription}
                      onChange={(e) => setRegistrationDescription(e.target.value)}
                      placeholder="Tell attendees what they need to provide"
                      rows={3}
                      className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                    />

                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Custom fields</p>
                      <button
                        type="button"
                        onClick={addRegistrationField}
                        className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10"
                      >
                        Add field
                      </button>
                    </div>

                    {registrationFields.map((field, index) => (
                      <div key={field.key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            value={field.label}
                            onChange={(e) => updateRegistrationField(index, { label: e.target.value })}
                            placeholder="Field label"
                            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                          />
                          <button
                            type="button"
                            onClick={() => removeRegistrationField(index)}
                            className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-slate-400 hover:text-red-400"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <select
                            value={field.type}
                            onChange={(e) => updateRegistrationField(index, { type: e.target.value as typeof field.type })}
                            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                          >
                            <option value="text">Text</option>
                            <option value="email">Email</option>
                            <option value="tel">Phone</option>
                            <option value="textarea">Textarea</option>
                            <option value="number">Number</option>
                          </select>
                          <input
                            value={field.placeholder || ''}
                            onChange={(e) => updateRegistrationField(index, { placeholder: e.target.value })}
                            placeholder="Placeholder"
                            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                          />
                        </div>
                        <label className="flex items-center gap-2 text-xs text-slate-400">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateRegistrationField(index, { required: e.target.checked })}
                            className="h-4 w-4 rounded border-white/20 bg-transparent"
                          />
                          Required
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Announcements list ────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
              Announcements ({announcements.length})
            </h2>
          </div>
          <div className="space-y-3">
            {announcements.length === 0 && !loading && !error && (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm">No announcements yet.</p>
              </div>
            )}
            {announcements.map((announcement) => (
              <div key={announcement.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span
                        className={`rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] ${getCategoryColor(announcement.category)}`}
                      >
                        {formatCategory(announcement.category)}
                      </span>
                      {announcement.isLive ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-mono">
                          <CheckCircle2 className="w-3 h-3" /> Sent {announcement.sentAt ? formatDate(announcement.sentAt) : ''}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 font-mono">Draft</span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white">{announcement.title}</h3>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">{announcement.body}</p>
                    {announcement.scheduledAt && !announcement.isLive && (
                      <p className="text-xs text-slate-500 mt-2">
                        Scheduled: {formatDate(announcement.scheduledAt)}
                      </p>
                    )}
                  </div>
                  {canCompose && (
                    <div className="flex items-center gap-2">
                      {/* Send button — only show for unsent announcements */}
                      {!announcement.isLive && (
                        <button
                          type="button"
                          onClick={() => handleSend(announcement.id)}
                          className="rounded-2xl border border-emerald-500/30 p-3 text-emerald-400 transition hover:border-emerald-400 hover:bg-emerald-500/10"
                          title="Send Now"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(announcement.id)}
                        className="rounded-2xl border border-white/10 p-3 text-slate-400 transition hover:border-red-400 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Events list ────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
              Upcoming Events ({events.filter(e => !isPastEvent(e)).length})
            </h2>
          </div>
          {deletingPastEvents && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <p className="text-sm text-amber-400">Cleaning up past events...</p>
            </div>
          )}
          <div className="space-y-3">
            {events.length === 0 && !loading && !error && (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm">No events yet.</p>
              </div>
            )}
            {events
              .filter(event => !isPastEvent(event))
              .map((event) => (
              <div key={event.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Accent color bar */}
                    <div
                      className="w-1.5 h-full min-h-[60px] rounded-full flex-shrink-0 mt-1"
                      style={{ backgroundColor: event.accent || '#1B3A7A' }}
                    />
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatEventDate(event.date)}
                        </span>
                        <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {event.time}
                        </span>
                        <span
                          className="rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                          style={{
                            backgroundColor: `${event.accent || '#1B3A7A'}20`,
                            color: event.accent || '#1B3A7A',
                            borderColor: `${event.accent || '#1B3A7A'}30`,
                          }}
                        >
                          {event.type}
                        </span>
                      </div>
                      {event.acceptRegistration && (
                        <div className="mt-3 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
                          Registration enabled
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {event.acceptRegistration && (
                      <button
                        type="button"
                        onClick={() => setExpandedEventId((current) => current === event.id ? null : event.id)}
                        className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10"
                      >
                        <span className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5" />
                          {event.registrations?.length ?? 0} regs
                        </span>
                      </button>
                    )}
                    {canCompose && (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(event.id)}
                        className="rounded-2xl border border-white/10 p-3 text-slate-400 transition hover:border-red-400 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {event.acceptRegistration && expandedEventId === event.id && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">Registrations</p>
                      <span className="text-xs text-slate-400">{event.registrations?.length ?? 0} total</span>
                    </div>
                    {(!event.registrations || event.registrations.length === 0) ? (
                      <p className="text-sm text-slate-500">No registrations yet for this event.</p>
                    ) : (
                      <div className="space-y-3">
                        {event.registrations.map((registration) => (
                          <div key={registration.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {registration.user?.name || registration.user?.email || 'Guest'}
                                </p>
                                {registration.user?.email && (
                                  <p className="text-xs text-slate-400">{registration.user.email}</p>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500">
                                {new Date(registration.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                            <div className="mt-3 space-y-2">
                              {Object.entries(registration.answers ?? {}).map(([key, value]) => {
                                const field = event.registrationFields?.find((item) => item.key === key)
                                const label = field?.label || key
                                const displayValue = value === null || value === undefined || value === '' ? '—' : String(value)

                                return (
                                  <div key={key} className="flex flex-col gap-1 rounded-xl bg-white/[0.03] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                                    <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</span>
                                    <span className="text-sm text-slate-200">{displayValue}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {/* Show past events in a collapsed section */}
            {events.some(event => isPastEvent(event)) && (
              <div className="mt-3">
                <details className="group">
                  <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-400 transition py-2 px-3 rounded-2xl border border-white/5 bg-white/[0.02]">
                    Show past events ({events.filter(e => isPastEvent(e)).length})
                  </summary>
                  <div className="mt-2 space-y-2 opacity-60">
                    {events
                      .filter(event => isPastEvent(event))
                      .map((event) => (
                        <div key={event.id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div
                              className="w-1 h-full min-h-[40px] rounded-full flex-shrink-0 mt-1"
                              style={{ backgroundColor: event.accent || '#1B3A7A' }}
                            />
                            <div className="min-w-0">
                              <h4 className="text-sm font-medium text-slate-300">{event.title}</h4>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-xs text-slate-500">
                                  {formatEventDate(event.date)} at {event.time}
                                </span>
                                <span className="text-xs text-red-400">Past</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>

        {/* ── Delete Confirmation Modal ─────────────────── */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="rounded-3xl border border-white/10 bg-slate-900 p-6 max-w-sm w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-red-500/10 p-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Confirm Delete</h3>
              </div>
              <p className="text-sm text-slate-400 mb-6">
                Are you sure you want to delete this item? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Check if it's an event or announcement being deleted
                    const isEvent = events.some(e => e.id === showDeleteConfirm)
                    if (isEvent) {
                      handleDeleteEvent(showDeleteConfirm)
                    } else {
                      handleDeleteAnnouncement(showDeleteConfirm)
                    }
                  }}
                  className="flex-1 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}