import rateLimit from "express-rate-limit";

// Tight limit on any auth flow that can be brute-forced (platform-admin
// login, church-member/staff login, church registration).
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts — try again later" },
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests — slow down" },
});
