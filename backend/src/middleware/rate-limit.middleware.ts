import rateLimit from "express-rate-limit";

// Tight limit on platform-admin auth — this is the login path for whoever
// can approve/suspend churches across the whole platform, so brute-force
// resistance matters more here than anywhere else in the app.
export const platformAuthRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts — try again later" },
});

export const platformApiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests — slow down" },
});
