import { Server, Socket } from "socket.io";
import {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData,
  ServicePayload,
} from "../types/socket.types";
import { liveState } from "../services/live-state.store";
import { validate, servicePayloadSchema } from "../modules/live-service/validators/event.validators";
import { sendToAll } from '../services/push.service'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type AppServer = Server<ClientToServerEvents, ServerToClientEvents>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, any, SocketData>;

const ALLOWED_ROLES = ["ADMIN", "PASTOR", "SECRETARY"];

export const registerServiceEvents = (io: AppServer, socket: AppSocket) => {
  const { role, email, churchId } = socket.data;

  socket.on("service:start", (raw) => {
    if (!ALLOWED_ROLES.includes(role)) {
      console.warn(`[socket] Unauthorized service:start by ${email} (${role})`);
      return;
    }
    try {
      const payload = validate(servicePayloadSchema, raw);
      const enriched: ServicePayload = {
        ...payload,
        startedBy: email,
        startedAt: new Date().toISOString(),
      };
      liveState.startService(churchId, enriched);
      console.log(`[socket] service:start — "${enriched.title}" by ${email}`);
      // Leadership + media only, this church's only
      io.to([
        `church:${churchId}:role:ADMIN`,
        `church:${churchId}:role:PASTOR`,
        `church:${churchId}:role:SECRETARY`,
        `church:${churchId}:role:MEDIA`,
      ]).emit("service:start", enriched);
      
      // Send push notification to all active users in this church
      sendToAll(prisma, churchId, {
        title: '⛪ Service is Live',
        body:  `${enriched.title} has started — join now`,
        data:  { type: 'service_start' },
      }).catch(err => console.warn('[push] service start notify failed:', err))
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid payload";
      console.warn(`[socket] service:start error from ${email}: ${msg}`);
    }
  });

  socket.on("service:end", (raw) => {
    if (!ALLOWED_ROLES.includes(role)) {
      console.warn(`[socket] Unauthorized service:end by ${email} (${role})`);
      return;
    }
    try {
      const payload = validate(servicePayloadSchema, raw);
      const enriched: ServicePayload = {
        ...payload,
        endedAt: new Date().toISOString(),
      };
      liveState.endService(churchId, enriched);
      console.log(`[socket] service:end — "${enriched.title}" by ${email}`);
      // Notify everyone in this church — service has ended
      io.to(`church:${churchId}`).emit("service:end", enriched);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid payload";
      console.warn(`[socket] service:end error from ${email}: ${msg}`);
    }
  });
};