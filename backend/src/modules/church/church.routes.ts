import { Router } from "express";
import { register } from "./church.controller";
import { authRateLimit } from "../../middleware/rate-limit.middleware";

const router = Router();

// Same rate limit as platform-admin auth — this is another public endpoint
// that creates real records and deserves brute-force/spam resistance.
router.post("/register", authRateLimit, register);

export default router;
