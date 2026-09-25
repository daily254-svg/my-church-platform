import { Request, Response } from "express";
import { ZodError, ZodIssue } from "zod";
import {
  createChurch,
  listChurches,
  getChurchById,
  approveChurch,
  suspendChurch,
  reactivateChurch,
  cancelChurch,
} from "./church.service";
import { createChurchSchema } from "./church.validation";

const formatZodError = (err: ZodError) =>
  err.issues.map((e: ZodIssue) => ({ field: e.path.join("."), message: e.message }));

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createChurchSchema.parse({ body: req.body });
    const church = await createChurch(parsed.body);
    res.status(201).json({ success: true, data: church });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(422).json({ success: false, errors: formatZodError(err) });
      return;
    }
    const message = err instanceof Error ? err.message : "Could not create church";
    res.status(400).json({ success: false, message });
  }
};

export const list = async (_req: Request, res: Response): Promise<void> => {
  try {
    const churches = await listChurches();
    res.status(200).json({ success: true, data: churches });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not fetch churches";
    res.status(500).json({ success: false, message });
  }
};

export const getOne = async (req: Request, res: Response): Promise<void> => {
  try {
    const church = await getChurchById(req.params.id);
    res.status(200).json({ success: true, data: church });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Church not found";
    res.status(404).json({ success: false, message });
  }
};

export const approve = async (req: Request, res: Response): Promise<void> => {
  try {
    const church = await approveChurch(req.params.id);
    res.status(200).json({ success: true, data: church });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not approve church";
    res.status(400).json({ success: false, message });
  }
};

export const suspend = async (req: Request, res: Response): Promise<void> => {
  try {
    const church = await suspendChurch(req.params.id);
    res.status(200).json({ success: true, data: church });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not suspend church";
    res.status(400).json({ success: false, message });
  }
};

export const reactivate = async (req: Request, res: Response): Promise<void> => {
  try {
    const church = await reactivateChurch(req.params.id);
    res.status(200).json({ success: true, data: church });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not reactivate church";
    res.status(400).json({ success: false, message });
  }
};

export const cancel = async (req: Request, res: Response): Promise<void> => {
  try {
    const church = await cancelChurch(req.params.id);
    res.status(200).json({ success: true, data: church });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not cancel church";
    res.status(400).json({ success: false, message });
  }
};
