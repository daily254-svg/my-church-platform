export interface ScripturePayload {
  reference: string;
  text:      string;
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
  currentService:  ServicePayload | null;
  currentScripture: ScripturePayload | null;
  serviceStatus:   "live" | "idle";
  connectedCount:   number;
}

export interface DeviceRegion {
  name:    string;
  devices: number;
  synced:  number;
  status:  'healthy' | 'warning' | 'error';
}

export interface SyncHealthPayload {
  health:   number;
  regions:  DeviceRegion[];
}

export interface MinistryMessagePayload {
  groupId: string;
  message: {
    id: string;
    text: string;
    createdAt: string;
    user: { name: string };
  };
}

// ── Server → Client ────────────────────────────────────────
export interface ServerToClientEvents {
  "service:start":       (payload: ServicePayload) => void;
  "service:end":         (payload: ServicePayload) => void;
  "scripture:update":    (payload: ScripturePayload) => void;
  "announcement:update": (payload: AnnouncementPayload) => void;
  "sync:state":          (payload: SyncStatePayload) => void;
  "sync:health":         (payload: SyncHealthPayload) => void;
  "connected:count":     (payload: { count: number }) => void;
  "ministry:message":    (payload: MinistryMessagePayload) => void;
  "connections:update":  (count: number) => void;
}

// ── Client → Server ────────────────────────────────────────
export interface ClientToServerEvents {
  "service:start":       (payload: ServicePayload) => void;
  "service:end":         (payload: ServicePayload) => void;
  "scripture:update":    (payload: ScripturePayload) => void;
  "announcement:update": (payload: AnnouncementPayload) => void;
  "sync:acknowledged":   () => void;
  "ministry:join_room":  (payload: { groupId: string }) => void;
  "ministry:leave_room": (payload: { groupId: string }) => void;
}

// ── Per-socket data ────────────────────────────────────────
export interface SocketData {
  userId:         string;
  email:          string;
  role:           string;
  churchId:       string;
  synced?:        boolean;
  region?:        string;
  connectionType?: string;
}