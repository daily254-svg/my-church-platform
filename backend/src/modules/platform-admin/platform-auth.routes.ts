import { Router } from "express";
import { login, totpSetup, totpEnable, totpVerify, me } from "./platform-auth.controller";
import { authenticatePlatform, authenticatePreMfa } from "../../middleware/platform-auth.middleware";
import { platformAuthRateLimit } from "../../middleware/rate-limit.middleware";

const router = Router();

router.post("/login", platformAuthRateLimit, login);
router.post("/totp/setup", platformAuthRateLimit, authenticatePreMfa, totpSetup);
router.post("/totp/enable", platformAuthRateLimit, authenticatePreMfa, totpEnable);
router.post("/totp/verify", platformAuthRateLimit, authenticatePreMfa, totpVerify);
router.get("/me", authenticatePlatform, me);

export default router;
