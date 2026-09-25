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

// Brevo (transactional email) — used for staff invites.
export const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
export const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || '';
export const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'My Church Platform';
// Where invite emails point people to — the church-admin app's URL. Left
// blank in dev since Codespaces URLs are dynamic; the email still includes
// the raw token so it can be pasted in manually.
export const CHURCH_ADMIN_URL = process.env.CHURCH_ADMIN_URL || '';
