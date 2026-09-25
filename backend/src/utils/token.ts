import crypto from "crypto";

export const generateSecureToken = (): string => crypto.randomBytes(32).toString("hex");
