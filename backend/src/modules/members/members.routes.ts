import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { listPending, approve, reject } from "./members.controller";

const router = Router();

const LEADERSHIP = ["ADMIN", "PASTOR", "SECRETARY"] as const;

router.get("/pending", authenticate, authorize([...LEADERSHIP]), listPending);
router.post("/:userId/approve", authenticate, authorize([...LEADERSHIP]), approve);
router.post("/:userId/reject", authenticate, authorize([...LEADERSHIP]), reject);

export default router;
