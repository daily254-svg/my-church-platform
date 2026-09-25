import { Request, Response } from "express";
import { ZodError, ZodIssue } from "zod";
import { assignPlan, changeSubscriptionStatus, getSubscription } from "./subscription.service";
import { assignPlanSchema, changeStatusSchema } from "./subscription.validation";

const formatZodError = (err: ZodError) =>
  err.issues.map((e: ZodIssue) => ({ field: e.path.join("."), message: e.message }));

export const get = async (req: Request, res: Response): Promise<void> => {
  try {
    const subscription = await getSubscription(req.params.churchId);
    res.status(200).json({ success: true, data: subscription });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not fetch subscription";
    res.status(404).json({ success: false, message });
  }
};

export const changePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = assignPlanSchema.parse({ body: req.body });
    const subscription = await assignPlan(req.params.churchId, parsed.body.planId);
    res.status(200).json({ success: true, data: subscription });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(422).json({ success: false, errors: formatZodError(err) });
      return;
    }
    const message = err instanceof Error ? err.message : "Could not assign plan";
    res.status(400).json({ success: false, message });
  }
};

export const changeStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = changeStatusSchema.parse({ body: req.body });
    const subscription = await changeSubscriptionStatus(req.params.churchId, parsed.body.status);
    res.status(200).json({ success: true, data: subscription });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(422).json({ success: false, errors: formatZodError(err) });
      return;
    }
    const message = err instanceof Error ? err.message : "Could not update subscription status";
    res.status(400).json({ success: false, message });
  }
};
