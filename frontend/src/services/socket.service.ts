import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "../constants";

// ── Payload types (mirrors backend socket.types.ts) ───────

export interface ScripturePayload {
  reference: string;
  text:      string;
  version?:   string;
}

export interface AnnouncementPayload {
  id:       string;
  title:    string;
  body:     string;
  postedBy: string;
  postedAt: string;
}

export interface ServicePayload {
  serviceId:  string;
  title:      string;
  startedBy?: string;
  startedAt?: string;
  endedAt?:   string;
}

export interface SyncStatePayload {
  currentService:   ServicePayload | null;
  currentScripture: ScripturePayload | null;
  serviceStatus:    "live" | "idle";
  connectedCount:   number;
}

// ── Socket service ─────────────────────────────────────────

class SocketService {
  private socket: Socket | null = null;

  connect(token: string): Socket {
    if (this.socket?.connected) return this.socket;

    this.socket = io(SOCKET_URL, {
      auth:       { token: `Bearer ${token}` },
      transports: ["websocket", "polling"],
      reconnection:        true,
      reconnectionAttempts: 5,
      reconnectionDelay:   2000,
    });

    this.socket.on("connect", () => {
    });

    this.socket.on("connect_error", (err) => {
      console.warn("[socket] connection error:", err.message);
    });

    this.socket.on("disconnect", (reason) => {
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // ── Emitters (Media Panel will use these) ───────────────

  emitScriptureUpdate(payload: ScripturePayload): void {
    this.socket?.emit("scripture:update", payload);
  }

  emitServiceStart(payload: ServicePayload): void {
    this.socket?.emit("service:start", payload);
  }

  emitServiceEnd(payload: ServicePayload): void {
    this.socket?.emit("service:end", payload);
  }

  emitAnnouncement(payload: AnnouncementPayload): void {
    this.socket?.emit("announcement:update", payload);
  }
}

// Singleton — one connection shared across the whole app
export const socketService = new SocketService();