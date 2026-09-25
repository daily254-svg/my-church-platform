import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { listPending, listActive, approve, reject, leaveSelf, markLeft, listInvites, invite, revoke } from "./members.controller";

const router = Router();

const LEADERSHIP = ["ADMIN", "PASTOR", "SECRETARY"] as const;

router.get("/pending", authenticate, authorize([...LEADERSHIP]), listPending);
router.post("/:userId/approve", authenticate, authorize([...LEADERSHIP]), approve);
router.post("/:userId/reject", authenticate, authorize([...LEADERSHIP]), reject);

router.get("/", authenticate, authorize([...LEADERSHIP]), listActive);
router.post("/leave", authenticate, leaveSelf);
// Narrower than the rest of LEADERSHIP — removing an active member is an
// ADMIN/SECRETARY records action, not a pastoral one.
router.post("/:userId/mark-left", authenticate, authorize(["ADMIN", "SECRETARY"]), markLeft);

// Staff invites — ADMIN only, this is how new leadership seats are granted.
router.get("/invites", authenticate, authorize(["ADMIN"]), listInvites);
router.post("/invites", authenticate, authorize(["ADMIN"]), invite);
router.post("/invites/:inviteId/revoke", authenticate, authorize(["ADMIN"]), revoke);

export default router;
