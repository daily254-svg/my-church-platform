import jwt, { SignOptions, JwtPayload } from "jsonwebtoken";
import {
  PLATFORM_JWT_SECRET,
  PLATFORM_JWT_EXPIRES_IN,
  PLATFORM_PRE_MFA_EXPIRES_IN,
} from "../config/env";

export interface PlatformTokenPayload {
  staffId: string;
  email: string;
  role: string;
  scope: "platform";
}

export interface PreMfaTokenPayload {
  staffId: string;
  scope: "platform-pre-mfa";
}

export const generatePlatformToken = (payload: Omit<PlatformTokenPayload, "scope">): string => {
  const options: SignOptions = { expiresIn: PLATFORM_JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign({ ...payload, scope: "platform" }, PLATFORM_JWT_SECRET, options);
};

export const verifyPlatformToken = (token: string): PlatformTokenPayload => {
  const decoded = jwt.verify(token, PLATFORM_JWT_SECRET) as JwtPayload & PlatformTokenPayload;
  if (decoded.scope !== "platform") {
    throw new Error("Invalid token scope");
  }
  return {
    staffId: decoded.staffId,
    email: decoded.email,
    role: decoded.role,
    scope: "platform",
  };
};

// Issued after password verification, before TOTP — narrow scope, short life,
// can only be redeemed at the TOTP-verify endpoint, nowhere else.
export const generatePreMfaToken = (staffId: string): string => {
  const options: SignOptions = { expiresIn: PLATFORM_PRE_MFA_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign({ staffId, scope: "platform-pre-mfa" }, PLATFORM_JWT_SECRET, options);
};

export const verifyPreMfaToken = (token: string): PreMfaTokenPayload => {
  const decoded = jwt.verify(token, PLATFORM_JWT_SECRET) as JwtPayload & PreMfaTokenPayload;
  if (decoded.scope !== "platform-pre-mfa") {
    throw new Error("Invalid token scope");
  }
  return { staffId: decoded.staffId, scope: "platform-pre-mfa" };
};
