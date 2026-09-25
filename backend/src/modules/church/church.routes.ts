import { Router } from "express";
import { register, addBranch, getBranches } from "./church.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { authRateLimit } from "../../middleware/rate-limit.middleware";

const router = Router();

// Same rate limit as platform-admin auth — this is another public endpoint
// that creates real records and deserves brute-force/spam resistance.
router.post("/register", authRateLimit, register);

// Branches — only the mother church's own ADMIN can add one to itself.
router.get("/branches", authenticate, authorize(["ADMIN"]), getBranches);
router.post("/branches", authenticate, authorize(["ADMIN"]), addBranch);

export default router;
