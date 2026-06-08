import { io, Socket } from 'socket.io-client'
import { SOCKET_URL } from '../utils/constants'

// ── Payload types (mirrors backend) ───────────────────────

export interface ScripturePayload {
  reference: string
  text:      string
  version?:  string
}

export interface ServicePayload {
  serviceId:  string
  title:      string
  startedBy?: string
  startedAt?: string
  endedAt?:   string
}

export interface AnnouncementPayload {
  id:       string
  title:    string
  body:     string
  postedBy: string
  postedAt: string
}

export interface SyncStatePayload {
  currentService:   ServicePayload | null
  currentScripture: ScripturePayload | null
  serviceStatus:    'live' | 'idle'
}

// ── Socket service singleton ───────────────────────────────

class SocketService {
  private socket: Socket | null = null

  connect(token: string): Socket {
    if (this.socket?.connected) return this.socket

    this.socket = io(SOCKET_URL, {
      auth: { token: `Bearer ${token}` },
      transports:   ['websocket', 'polling'],
      reconnection:         true,
      reconnectionAttempts: 5,
      reconnectionDelay:    2000,
    })

    this.socket.on('connect', () => {
      console.log('[socket] connected:', this.socket?.id)
    })

    this.socket.on('connect_error', (err) => {
      console.warn('[socket] error:', err.message)
    })

    this.socket.on('disconnect', (reason) => {
      console.log('[socket] disconnected:', reason)
    })

    return this.socket
  }

  disconnect(): void {
    this.socket?.disconnect()
    this.socket = null
  }

  getSocket(): Socket | null {
    return this.socket
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  // ── Emitters ──────────────────────────────────────────────

  emitScriptureUpdate(payload: ScripturePayload): void {
    if (!this.socket?.connected) {
      console.warn('[socket] not connected — scripture not sent')
      return
    }
    this.socket.emit('scripture:update', payload)
    console.log('[socket] scripture:update emitted:', payload.reference)
  }

  emitServiceStart(payload: ServicePayload): void {
    if (!this.socket?.connected) {
      console.warn('[socket] not connected — service:start not sent')
      return
    }
    this.socket.emit('service:start', payload)
    console.log('[socket] service:start emitted:', payload.title)
  }

  emitServiceEnd(payload: ServicePayload): void {
    if (!this.socket?.connected) {
      console.warn('[socket] not connected — service:end not sent')
      return
    }
    this.socket.emit('service:end', payload)
    console.log('[socket] service:end emitted:', payload.title)
  }

  emitAnnouncement(payload: AnnouncementPayload): void {
    if (!this.socket?.connected) {
      console.warn('[socket] not connected — announcement not sent')
      return
    }
    this.socket.emit('announcement:update', payload)
    console.log('[socket] announcement:update emitted:', payload.title)
  }
}

export const socketService = new SocketService()