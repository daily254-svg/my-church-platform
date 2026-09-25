import { Request, Response } from "express";
import { listPendingMembers, approveMember, rejectMember } from "./members.service";

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
