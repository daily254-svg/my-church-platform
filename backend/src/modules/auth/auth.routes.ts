import { Router } from "express";
import { register, login, me, roleAvailability, updatePushToken, updateAvatar, validateRole, totpSetup, totpEnable, totpVerify, acceptInvite } from "./auth.controller";
import { authenticate, authenticatePreMfa } from "../../middleware/auth.middleware";
import { upload } from "../../middleware/upload.middleware";
import { authRateLimit } from "../../middleware/rate-limit.middleware";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", authRateLimit, login);
router.get("/role-availability", roleAvailability);
router.post('/validate-role', authenticate, validateRole);
router.post("/accept-invite", authRateLimit, acceptInvite);

// MFA — reached with the preMfaToken login() returns for staff roles
router.post("/totp/setup", authRateLimit, authenticatePreMfa, totpSetup);
router.post("/totp/enable", authRateLimit, authenticatePreMfa, totpEnable);
router.post("/totp/verify", authRateLimit, authenticatePreMfa, totpVerify);

// Protected route — requires valid JWT
router.get("/me", authenticate, me);
router.post('/push-token', authenticate, updatePushToken)
router.post('/avatar', authenticate, upload.single('avatar'), updateAvatar);

export default router;