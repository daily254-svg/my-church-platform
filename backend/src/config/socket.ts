import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { socketAuthMiddleware } from "../sockets/socket.auth";
import { registerServiceEvents } from "../sockets/service.events";
import { registerScriptureEvents } from "../sockets/scripture.events";
import { registerAnnouncementEvents } from "../sockets/announcement.events";
import { registerMinistryEvents } from "../sockets/ministry.events";
import { liveState } from "../services/live-state.store";
import {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData,
} from "../types/socket.types";

// Define device regions (can be moved to a config file)
const DEVICE_REGIONS = [
  { name: 'Main Sanctuary', role: 'MAIN_HALL' },
  { name: 'Youth Hall', role: 'YOUTH_HALL' },
  { name: 'Overflow Room', role: 'OVERFLOW' },
  { name: 'Online Viewers', role: 'ONLINE' },
];

const churchRoom = (churchId: string) => `church:${churchId}`;
const churchRoleRoom = (churchId: string, role: string) => `church:${churchId}:role:${role}`;
const churchUserRoom = (churchId: string, userId: string) => `church:${churchId}:user:${userId}`;

const LEADERSHIP_ROLES = ["ADMIN", "MEDIA", "PASTOR", "SECRETARY"];

export const initSocket = (httpServer: HttpServer) => {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, any, SocketData>(
    httpServer,
    {
      cors: {
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
    }
  );

  // ── Broadcast connected count + sync health, scoped to one church ──
  const broadcastChurchStatus = async (churchId: string) => {
    try {
      const sockets = await io.in(churchRoom(churchId)).fetchSockets();
      const totalDevices = sockets.length;

      const leadershipRooms = LEADERSHIP_ROLES.map(role => churchRoleRoom(churchId, role));

      // Leadership gets the detailed count event
      io.to(leadershipRooms).emit("connected:count", { count: totalDevices });
      // Everyone in this church gets the simple connections:update (for the live banner)
      io.to(churchRoom(churchId)).emit("connections:update", totalDevices);

      // Count synced devices (devices that have acknowledged the latest scripture/state)
      const syncedDevices = sockets.filter(s => s.data.synced === true).length;
      const health = totalDevices > 0 ? Math.round((syncedDevices / totalDevices) * 100) : 0;

      const regions = DEVICE_REGIONS.map(region => {
        const regionSockets = sockets.filter(s => {
          return s.data.region === region.role ||
                 (region.role === 'ONLINE' && s.data.connectionType === 'remote');
        });

        const regionTotal = regionSockets.length;
        const regionSynced = regionSockets.filter(s => s.data.synced === true).length;

        let status: 'healthy' | 'warning' | 'error' = 'healthy';
        if (regionTotal === 0) {
          status = 'healthy';
        } else {
          const regionHealth = (regionSynced / regionTotal) * 100;
          if (regionHealth >= 90) status = 'healthy';
          else if (regionHealth >= 70) status = 'warning';
          else status = 'error';
        }

        return { name: region.name, devices: regionTotal, synced: regionSynced, status };
      });

      io.to(leadershipRooms).emit("sync:health", { health, regions });
    } catch (error) {
      console.error(`[socket] Error broadcasting status for church ${churchId}:`, error);
    }
  };

  // ── Auth middleware ────────────────────────────────────
  io.use(socketAuthMiddleware);

  // ── Connection handler ─────────────────────────────────
  io.on("connection", (socket) => {
    const { userId, email, role, churchId } = socket.data;

    // Centralized connection log (only place we log connections)
    console.log(`[socket] + connected   ${email} (${role}) [${socket.id}]`);

    // Initialize sync status
    socket.data.synced = false;

    // Store connection type and region (you can set these from client handshake)
    if (!socket.data.region) {
      socket.data.region = 'ONLINE'; // Default for web clients
      socket.data.connectionType = 'remote';
    }

    // Join church-scoped rooms — a church's sockets never share a role/user
    // room with another church's.
    socket.join(churchRoom(churchId));
    socket.join(churchRoleRoom(churchId, role));
    socket.join(churchUserRoom(churchId, userId));

    // ── Broadcast updated connected count and sync health for this church ──
    broadcastChurchStatus(churchId);

    // ── sync:state — send current service state immediately, this church's only ──
    // Critical for late joiners, WiFi drops, app restarts
    const state = liveState.get(churchId);
    const churchSocketCount = io.sockets.adapter.rooms.get(churchRoom(churchId))?.size ?? 1;
    socket.emit("sync:state", {
      currentService: state.isLive
        ? {
            serviceId:  state.serviceId!,
            title:      state.serviceTitle!,
            startedBy:  state.startedBy!,
            startedAt:  state.startedAt!,
          }
        : null,
      currentScripture: state.currentScripture,
      serviceStatus: state.isLive ? "live" : "idle",
      connectedCount:   churchSocketCount,
    });


    // ── Listen for sync acknowledgements from clients ──
    socket.on("sync:acknowledged", () => {
      socket.data.synced = true;
      broadcastChurchStatus(churchId); // Update sync health when a device acknowledges
    });

    // ── Register event groups ──────────────────────────────
    registerServiceEvents(io, socket);
    registerScriptureEvents(io, socket);
    registerAnnouncementEvents(io, socket);
    registerMinistryEvents(io, socket);

    // ── Disconnect ─────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      console.log(`[socket] - disconnected ${email} (${role}) — ${reason}`);
      broadcastChurchStatus(churchId);
    });
  });

  // ── Periodic sync health broadcast, per church with active connections ──
  setInterval(async () => {
    const sockets = await io.fetchSockets();
    const churchIds = new Set(sockets.map(s => s.data.churchId));
    churchIds.forEach(churchId => broadcastChurchStatus(churchId));
  }, 10000);

  return io;
};
