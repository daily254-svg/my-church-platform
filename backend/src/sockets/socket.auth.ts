import { Socket } from "socket.io";
import { verifyToken } from "../utils/jwt";
import { SocketData } from "../types/socket.types";

export const socketAuthMiddleware = (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    const raw =
      (socket.handshake.auth?.token as string) ||
      (socket.handshake.headers?.token as string) ||
      (socket.handshake.headers?.authorization as string) ||
      (socket.handshake.query?.token as string) ||
      undefined;

    if (!raw) {
      return next(new Error("AUTH_MISSING: No token provided"));
    }

    const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;
    const decoded = verifyToken(token);

    (socket.data as SocketData) = {
      userId:   decoded.userId,
      email:    decoded.email,
      role:     decoded.role,
      churchId: decoded.churchId,
    };

    next();
  } catch {
    next(new Error("AUTH_INVALID: Token invalid or expired"));
  }
};