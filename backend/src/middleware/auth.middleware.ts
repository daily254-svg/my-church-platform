import { Request, Response, NextFunction } from "express";
import { verifyToken, verifyPreMfaToken, TokenPayload } from "../utils/jwt";

// Extend Express Request to carry the decoded user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      preMfaUserId?: string;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    req.user = {
      ...decoded,
      id: decoded.userId,
    } as TokenPayload & { id: string };
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// Guards the TOTP setup/enable/verify endpoints — only redeemable with the
// narrow, short-lived token issued right after password verification.
export const authenticatePreMfa = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyPreMfaToken(token);
    req.preMfaUserId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};