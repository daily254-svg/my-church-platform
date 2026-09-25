import { Request, Response } from "express";
import {
  createPrayer as createPrayerService,
  getAllPrayers as getAllPrayersService,
  prayForRequest as prayForRequestService,
  deletePrayer as deletePrayerService,
} from "./prayer.service";
import { createPrayerSchema, praySchema } from "./prayer.validation";
import { ZodError, ZodIssue } from "zod";

const formatZodError = (err: ZodError) =>
  err.issues.map((e: ZodIssue) => ({ field: e.path.join("."), message: e.message }));

export const createPrayer = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createPrayerSchema.parse({ body: req.body });
    const userId = req.user?.userId;
    const churchId = req.user?.churchId;
    if (!userId || !churchId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const result = await createPrayerService(parsed.body, userId, churchId);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(422).json({ success: false, errors: formatZodError(err) });
      return;
    }
    const message = err instanceof Error ? err.message : "Failed to create prayer request";
    res.status(400).json({ success: false, message });
  }
};

export const getAllPrayers = async (req: Request, res: Response): Promise<void> => {
  try {
    const churchId = req.user?.churchId;
    if (!churchId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const result = await getAllPrayersService(churchId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch prayer requests";
    res.status(400).json({ success: false, message });
  }
};

export const prayForRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = praySchema.parse({ params: req.params }).params;
    const churchId = req.user?.churchId;
    if (!churchId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const result = await prayForRequestService(id, churchId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(422).json({ success: false, errors: formatZodError(err) });
      return;
    }
    const message = err instanceof Error ? err.message : "Failed to pray for request";
    res.status(400).json({ success: false, message });
  }
};

export const deletePrayer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = praySchema.parse({ params: req.params }).params;
    const userId = req.user?.userId;
    const churchId = req.user?.churchId;
    if (!userId || !churchId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const result = await deletePrayerService(id, userId, churchId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(422).json({ success: false, errors: formatZodError(err) });
      return;
    }
    const message = err instanceof Error ? err.message : "Failed to delete prayer request";
    res.status(400).json({ success: false, message });
  }
};