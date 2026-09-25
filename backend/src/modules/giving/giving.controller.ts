import { Request, Response } from 'express';
import {
  createGiving,
  getUserGivings,
  getAllGivings,
  getGivingSummary,
} from './giving.service';
import { createGivingSchema } from './giving.validation';

export const submitGiving = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const churchId = req.user?.churchId;
    if (!userId || !churchId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - user not found',
      });
    }

    const parsed = createGivingSchema.parse(req.body);
    const result = await createGiving(parsed, userId, churchId);

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to submit giving',
    });
  }
};

export const getMyGivings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - user not found',
      });
    }
    
    const result = await getUserGivings(userId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch givings',
    });
  }
};

export const getAllGivingsController = async (req: Request, res: Response) => {
  try {
    const churchId = req.user?.churchId;
    if (!churchId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const { type, search } = req.query;
    const result = await getAllGivings(churchId, {
      type: type as string | undefined,
      search: search as string | undefined,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch givings',
    });
  }
};

export const getSummary = async (req: Request, res: Response) => {
  try {
    const churchId = req.user?.churchId;
    if (!churchId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const result = await getGivingSummary(churchId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch summary',
    });
  }
};