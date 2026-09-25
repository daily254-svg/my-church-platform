import { Request, Response } from "express";
import { ZodError, ZodIssue } from "zod";
import { listPlans, createPlan, updatePlan } from "./plan.service";
import { createPlanSchema, updatePlanSchema } from "./plan.validation";

const formatZodError = (err: ZodError) =>
  err.issues.map((e: ZodIssue) => ({ field: e.path.join("."), message: e.message }));

export const list = async (_req: Request, res: Response): Promise<void> => {
  try {
    const plans = await listPlans();
    res.status(200).json({ success: true, data: plans });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not fetch plans";
    res.status(500).json({ success: false, message });
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createPlanSchema.parse({ body: req.body });
    const plan = await createPlan(parsed.body);
    res.status(201).json({ success: true, data: plan });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(422).json({ success: false, errors: formatZodError(err) });
      return;
    }
    const message = err instanceof Error ? err.message : "Could not create plan";
    res.status(400).json({ success: false, message });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = updatePlanSchema.parse({ body: req.body });
    const plan = await updatePlan(req.params.id, parsed.body);
    res.status(200).json({ success: true, data: plan });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(422).json({ success: false, errors: formatZodError(err) });
      return;
    }
    const message = err instanceof Error ? err.message : "Could not update plan";
    res.status(400).json({ success: false, message });
  }
};
