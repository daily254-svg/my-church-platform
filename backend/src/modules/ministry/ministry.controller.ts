import { Request, Response } from 'express';
import {
  getAllGroups as getAllGroupsService,
  joinGroup as joinGroupService,
  leaveGroup as leaveGroupService,
  getGroupMessages as getGroupMessagesService,
  sendMessage as sendMessageService,
  getUserGroups as getUserGroupsService,
} from './ministry.service';
import { sendMessageSchema } from './ministry.validation';
import { ZodError, ZodIssue } from 'zod';

const formatZodError = (err: ZodError) =>
  err.issues.map((e: ZodIssue) => ({ field: e.path.join('.'), message: e.message }));

export const getAllGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    const churchId = req.user?.churchId;
    if (!churchId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const result = await getAllGroupsService(churchId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch groups';
    res.status(400).json({ success: false, message });
  }
};

export const getUserGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const result = await getUserGroupsService(userId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch user groups';
    res.status(400).json({ success: false, message });
  }
};

export const joinGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    const userId = req.user?.userId;
    const churchId = req.user?.churchId;
    if (!userId || !churchId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const result = await joinGroupService(groupId, userId, churchId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to join group';
    res.status(400).json({ success: false, message });
  }
};

export const leaveGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const result = await leaveGroupService(groupId, userId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to leave group';
    res.status(400).json({ success: false, message });
  }
};

export const getGroupMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    const churchId = req.user?.churchId;
    if (!churchId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const result = await getGroupMessagesService(groupId, churchId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch messages';
    res.status(400).json({ success: false, message });
  }
};

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    const parsed = sendMessageSchema.parse({ body: req.body });
    const userId = req.user?.userId;
    const churchId = req.user?.churchId;
    if (!userId || !churchId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const io = req.app.get('io');
    const result = await sendMessageService(groupId, parsed.body.text, userId, churchId, io);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(422).json({ success: false, errors: formatZodError(err) });
      return;
    }
    const message = err instanceof Error ? err.message : 'Failed to send message';
    res.status(400).json({ success: false, message });
  }
};