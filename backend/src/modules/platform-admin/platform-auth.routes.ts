import { Router } from "express";
import { login, totpSetup, totpEnable, totpVerify, me } from "./platform-auth.controller";
import { authenticatePlatform, authenticatePreMfa } from "../../middleware/platform-auth.middleware";
import { authRateLimit } from "../../middleware/rate-limit.middleware";

const router = Router();

router.post("/login", authRateLimit, login);
router.post("/totp/setup", authRateLimit, authenticatePreMfa, totpSetup);
router.post("/totp/enable", authRateLimit, authenticatePreMfa, totpEnable);
router.post("/totp/verify", authRateLimit, authenticatePreMfa, totpVerify);
router.get("/me", authenticatePlatform, me);

export default router;
