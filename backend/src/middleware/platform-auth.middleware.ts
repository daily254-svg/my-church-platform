import { Request, Response, NextFunction } from "express";
import { verifyPlatformToken, verifyPreMfaToken, PlatformTokenPayload } from "../utils/platform-jwt";

declare global {
  namespace Express {
    interface Request {
      platformStaff?: PlatformTokenPayload;
      preMfaStaffId?: string;
    }
  }
}

// Guards the TOTP setup/verify endpoints — only redeemable with the narrow,
// short-lived token issued right after password verification.
export const authenticatePreMfa = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyPreMfaToken(token);
    req.preMfaStaffId = decoded.staffId;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export const authenticatePlatform = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    req.platformStaff = verifyPlatformToken(token);
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export const requirePlatformRole = (allowedRoles: Array<"OWNER" | "SUPPORT">) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const staff = req.platformStaff;
    if (!staff) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    if (!allowedRoles.includes(staff.role as "OWNER" | "SUPPORT")) {
      res.status(403).json({
        success: false,
        message: `Access denied — requires one of: ${allowedRoles.join(", ")}`,
      });
      return;
    }
    next();
  };
};
