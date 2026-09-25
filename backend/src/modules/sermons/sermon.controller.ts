import { Request, Response } from "express";
import * as sermonService from "./sermon.service";
import {
  createSermonSchema,
  updateSermonSchema,
  updateStatusSchema,
} from "./sermon.validation";

export const createSermon = async (req: Request, res: Response) => {
  try {
    const validation = createSermonSchema.safeParse(req);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: validation.error.issues[0].message,
      });
      return;
    }

    const churchId = req.user?.churchId;
    if (!churchId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const pastorName = req.user?.email || "Unknown";
    const result = await sermonService.createSermon(validation.data.body, pastorName, churchId);

    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllSermons = async (req: Request, res: Response) => {
  try {
    const churchId = req.user?.churchId;
    if (!churchId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const result = await sermonService.getAllSermons(churchId);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getSermonById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const churchId = req.user?.churchId;
    if (!churchId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const result = await sermonService.getSermonById(id, churchId);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateSermon = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const churchId = req.user?.churchId;
    if (!churchId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const validation = updateSermonSchema.safeParse(req);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: validation.error.issues[0].message,
      });
      return;
    }

    const result = await sermonService.updateSermon(id, churchId, validation.data.body);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateSermonStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const churchId = req.user?.churchId;
    if (!churchId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const validation = updateStatusSchema.safeParse(req);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: validation.error.issues[0].message,
      });
      return;
    }

    const result = await sermonService.updateSermonStatus(
      id,
      churchId,
      validation.data.body.status
    );
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteSermon = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const churchId = req.user?.churchId;
    if (!churchId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const result = await sermonService.deleteSermon(id, churchId);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
