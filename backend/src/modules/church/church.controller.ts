import { Request, Response } from "express";
import { ZodError, ZodIssue } from "zod";
import { registerChurch } from "./church.service";
import { registerChurchSchema } from "./church.validation";

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
