import { ScripturePayload, ServicePayload } from "../types/socket.types";

export interface LiveServiceState {
  isLive: boolean;
  serviceId: string | null;
  serviceTitle: string | null;
  startedBy: string | null;
  startedAt: string | null;
  currentScripture: ScripturePayload | null;
  lastUpdated: string;
}

const initialState = (): LiveServiceState => ({
  isLive: false,
  serviceId: null,
  serviceTitle: null,
  startedBy: null,
  startedAt: null,
  currentScripture: null,
  lastUpdated: new Date().toISOString(),
});

// One live-service state per church — churches must never see or affect
// each other's live sermon/scripture sync. In-memory Map, swap for Redis
// later without changing this interface.
const stateByChurch = new Map<string, LiveServiceState>();

const getOrInit = (churchId: string): LiveServiceState => {
  let state = stateByChurch.get(churchId);
  if (!state) {
    state = initialState();
    stateByChurch.set(churchId, state);
  }
  return state;
};

export const liveState = {
  get(churchId: string): LiveServiceState {
    return { ...getOrInit(churchId) };
  },

  startService(churchId: string, payload: ServicePayload): LiveServiceState {
    const next: LiveServiceState = {
      ...getOrInit(churchId),
      isLive: true,
      serviceId: payload.serviceId,
      serviceTitle: payload.title,
      startedBy: payload.startedBy ?? null,
      startedAt: payload.startedAt ?? new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
    stateByChurch.set(churchId, next);
    return { ...next };
  },

  endService(churchId: string, payload: ServicePayload): LiveServiceState {
    const next: LiveServiceState = {
      ...getOrInit(churchId),
      isLive: false,
      serviceId: payload.serviceId,
      lastUpdated: new Date().toISOString(),
    };
    stateByChurch.set(churchId, next);
    return { ...next };
  },

  updateScripture(churchId: string, payload: ScripturePayload): LiveServiceState {
    const next: LiveServiceState = {
      ...getOrInit(churchId),
      currentScripture: payload,
      lastUpdated: new Date().toISOString(),
    };
    stateByChurch.set(churchId, next);
    return { ...next };
  },

  reset(churchId: string): void {
    stateByChurch.delete(churchId);
  },
};
