import { Request, Response } from "express";
import { ZodError, ZodIssue } from "zod";
import { registerChurch, createBranch, listBranches } from "./church.service";
import { registerChurchSchema, createBranchSchema } from "./church.validation";

const formatZodError = (err: ZodError) =>
  err.issues.map((e: ZodIssue) => ({ field: e.path.join("."), message: e.message }));

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = registerChurchSchema.parse({ body: req.body });
    const result = await registerChurch(parsed.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(422).json({ success: false, errors: formatZodError(err) });
      return;
    }
    const message = err instanceof Error ? err.message : "Church registration failed";
    res.status(400).json({ success: false, message });
  }
};

export const addBranch = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createBranchSchema.parse({ body: req.body });
    const churchId = req.user?.churchId;
    if (!churchId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const result = await createBranch(churchId, parsed.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(422).json({ success: false, errors: formatZodError(err) });
      return;
    }
    const message = err instanceof Error ? err.message : "Could not create branch";
    res.status(400).json({ success: false, message });
  }
};

export const getBranches = async (req: Request, res: Response): Promise<void> => {
  try {
    const churchId = req.user?.churchId;
    if (!churchId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const result = await listBranches(churchId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not fetch branches";
    res.status(400).json({ success: false, message });
  }
};
