export type Screen =
  | 'login'
  | 'dashboard'
  | 'live'
  | 'sermons'
  | 'announcements'
  | 'feed'
  | 'monitoring'
  | 'giving'

export type Role = 'Media' | 'Pastor' | 'Secretary' | 'Admin'

export interface Scripture {
  version?: string | undefined
  id: string
  ref: string
  text: string
  favorite?: boolean
}

export interface QueueItem {
  id: string
  ref: string
  text: string
  version?: string
  active?: boolean
  broadcast?: boolean
}

export interface ActivityItem {
  id: string
  type: 'scripture' | 'announcement' | 'service' | 'sync'
  message: string
  time: string
}

export interface Announcement {
  id: string
  title: string
  body: string
  category: 'General' | 'Event' | 'Emergency' | 'Prayer' | 'Offering'
  sent?: boolean
  time?: string
  scheduled?: string
}

// GivingRecord removed - it's already in giving.types.ts

export interface Sermon {
  id: string
  title: string
  series: string
  pastor: string
  date: string
  scriptures: string[]
  status: 'draft' | 'ready' | 'delivered'
}