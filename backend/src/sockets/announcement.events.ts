import { Server, Socket } from "socket.io";
import {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData,
  AnnouncementPayload,
} from "../types/socket.types";
import { validate, announcementPayloadSchema } from "../modules/live-service/validators/event.validators";

type AppServer = Server<ClientToServerEvents, ServerToClientEvents>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, any, SocketData>;

const ALLOWED_ROLES = ["ADMIN", "PASTOR", "SECRETARY"];

export const registerAnnouncementEvents = (io: AppServer, socket: AppSocket) => {
  const { role, email, churchId } = socket.data;

  socket.on("announcement:update", (raw) => {
    if (!ALLOWED_ROLES.includes(role)) {
      console.warn(`[socket] Unauthorized announcement:update by ${email} (${role})`);
      return;
    }
    try {
      const payload = validate(announcementPayloadSchema, raw);
      const enriched: AnnouncementPayload = {
        ...payload,
        postedBy: email,
        postedAt: new Date().toISOString(),
      };
      console.log(`[socket] announcement:update — "${enriched.title}" by ${email}`);
      // Announcements go to everyone in this church — not every church
      io.to(`church:${churchId}`).emit("announcement:update", enriched);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid payload";
      console.warn(`[socket] announcement:update error from ${email}: ${msg}`);
    }
  });
};