import { Router } from "express";
import authRoutes from "./platform-auth.routes";
import * as churchController from "./church.controller";
import * as planController from "./plan.controller";
import * as subscriptionController from "./subscription.controller";
import { authenticatePlatform, requirePlatformRole } from "../../middleware/platform-auth.middleware";
import { apiRateLimit } from "../../middleware/rate-limit.middleware";

const router = Router();

router.use("/auth", authRoutes);

// Everything below requires a fully-authenticated (password + TOTP) platform token.
router.use(apiRateLimit, authenticatePlatform);

// Churches — OWNER and SUPPORT can view/create, only OWNER can change lifecycle status.
router.get("/churches", churchController.list);
router.get("/churches/:id", churchController.getOne);
router.post("/churches", requirePlatformRole(["OWNER", "SUPPORT"]), churchController.create);
router.post("/churches/:id/approve", requirePlatformRole(["OWNER"]), churchController.approve);
router.post("/churches/:id/suspend", requirePlatformRole(["OWNER"]), churchController.suspend);
router.post("/churches/:id/reactivate", requirePlatformRole(["OWNER"]), churchController.reactivate);
router.post("/churches/:id/cancel", requirePlatformRole(["OWNER"]), churchController.cancel);

// Plans — pricing/capacity changes are OWNER-only.
router.get("/plans", planController.list);
router.post("/plans", requirePlatformRole(["OWNER"]), planController.create);
router.patch("/plans/:id", requirePlatformRole(["OWNER"]), planController.update);

// Subscriptions — keyed by the mother church's id.
router.get("/churches/:churchId/subscription", subscriptionController.get);
router.patch("/churches/:churchId/subscription/plan", requirePlatformRole(["OWNER"]), subscriptionController.changePlan);
router.patch("/churches/:churchId/subscription/status", requirePlatformRole(["OWNER"]), subscriptionController.changeStatus);

export default router;
