import { Request, Response } from "express";
import { ZodError, ZodIssue } from "zod";
import {
  listPendingMembers,
  listActiveMembers,
  approveMember,
  rejectMember,
  leaveChurch,
  getMemberDetail,
  listPendingInvites,
  inviteStaff,
  revokeInvite,
} from "./members.service";
import { inviteStaffSchema } from "./members.validation";

const formatZodError = (err: ZodError) =>
  err.issues.map((e: ZodIssue) => ({ field: e.path.join("."), message: e.message }));

export const listPending = async (req: Request, res: Response): Promise<void> => {
  try {
    const churchId = req.user?.churchId;
    if (!churchId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const result = await listPendingMembers(churchId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch pending members";
    res.status(400).json({ success: false, message });
  }
};

export const listActive = async (req: Request, res: Response): Promise<void> => {
  try {
    const churchId = req.user?.churchId;
    if (!churchId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const result = await listActiveMembers(churchId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch members";
    res.status(400).json({ success: false, message });
  }
};

export const approve = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const churchId = req.user?.churchId;
    if (!churchId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const result = await approveMember(userId, churchId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to approve member";
    res.status(400).json({ success: false, message });
  }
};

export const reject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const churchId = req.user?.churchId;
    if (!churchId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const result = await rejectMember(userId, churchId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to reject member";
    res.status(400).json({ success: false, message });
  }
};

export const leaveSelf = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const churchId = req.user?.churchId;
    if (!userId || !churchId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const result = await leaveChurch(userId, churchId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to leave church";
    res.status(400).json({ success: false, message });
  }
};

export const markLeft = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const churchId = req.user?.churchId;
    if (!churchId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const result = await leaveChurch(userId, churchId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to mark member as left";
    res.status(400).json({ success: false, message });
  }
};

export const getDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const churchId = req.user?.churchId;
    if (!churchId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const result = await getMemberDetail(userId, churchId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch member";
    res.status(400).json({ success: false, message });
  }
};

export const listInvites = async (req: Request, res: Response): Promise<void> => {
  try {
    const churchId = req.user?.churchId;
    if (!churchId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const result = await listPendingInvites(churchId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch invites";
    res.status(400).json({ success: false, message });
  }
};

export const invite = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = inviteStaffSchema.parse({ body: req.body });
    const churchId = req.user?.churchId;
    const invitedById = req.user?.userId;
    if (!churchId || !invitedById) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const result = await inviteStaff(churchId, invitedById, parsed.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(422).json({ success: false, errors: formatZodError(err) });
      return;
    }
    const message = err instanceof Error ? err.message : "Failed to send invite";
    res.status(400).json({ success: false, message });
  }
};

export const revoke = async (req: Request, res: Response): Promise<void> => {
  try {
    const { inviteId } = req.params;
    const churchId = req.user?.churchId;
    if (!churchId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const result = await revokeInvite(inviteId, churchId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to revoke invite";
    res.status(400).json({ success: false, message });
  }
};
