import jwt, { SignOptions, JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const PRE_MFA_EXPIRES_IN = "5m";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  churchId: string;
}

export const generateToken = (payload: TokenPayload): string => {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & TokenPayload & { scope?: string };
  // A pre-MFA token is signed with the same secret but carries a scope —
  // reject it here so it can never be used as a full session token on a
  // route that forgets to check churchId/role.
  if (decoded.scope) {
    throw new Error("Invalid token");
  }
  return {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role,
    churchId: decoded.churchId,
  };
};

export interface PreMfaTokenPayload {
  userId: string;
  scope: "church-pre-mfa";
}

// Issued after password verification, before TOTP — narrow scope, short
// life, only redeemable at the TOTP-verify/setup/enable endpoints.
export const generatePreMfaToken = (userId: string): string => {
  const options: SignOptions = { expiresIn: PRE_MFA_EXPIRES_IN };
  return jwt.sign({ userId, scope: "church-pre-mfa" }, JWT_SECRET, options);
};

export const verifyPreMfaToken = (token: string): PreMfaTokenPayload => {
  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & PreMfaTokenPayload;
  if (decoded.scope !== "church-pre-mfa") {
    throw new Error("Invalid token scope");
  }
  return { userId: decoded.userId, scope: "church-pre-mfa" };
};
