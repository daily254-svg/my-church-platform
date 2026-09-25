import dotenv from 'dotenv';

dotenv.config();

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const PORT = Number(process.env.PORT) || 4000;
export const DATABASE_URL = process.env.DATABASE_URL || '';
export const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
export const API_BIBLE_KEY = process.env.API_BIBLE_KEY || '';

// Deliberately separate from JWT_SECRET — platform-admin tokens (cross-tenant,
// can approve/suspend churches) must not be forgeable by anyone who only has
// the church-scoped member secret, and vice versa.
export const PLATFORM_JWT_SECRET = process.env.PLATFORM_JWT_SECRET || 'change-me-platform';
export const PLATFORM_JWT_EXPIRES_IN = process.env.PLATFORM_JWT_EXPIRES_IN || '12h';
// Short-lived token issued after password step, before TOTP is verified.
export const PLATFORM_PRE_MFA_EXPIRES_IN = '5m';
