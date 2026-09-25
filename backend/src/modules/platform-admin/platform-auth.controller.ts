import { Request, Response } from "express";
import { ZodError, ZodIssue } from "zod";
import {
  loginPlatformStaff,
  setupTotp,
  enableTotp,
  verifyTotpLogin,
  getCurrentPlatformStaff,
} from "./platform-auth.service";
import { platformLoginSchema, totpCodeSchema } from "./platform-auth.validation";

const formatZodError = (err: ZodError) =>
  err.issues.map((e: ZodIssue) => ({ field: e.path.join("."), message: e.message }));

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = platformLoginSchema.parse({ body: req.body });
    const result = await loginPlatformStaff(parsed.body);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(422).json({ success: false, errors: formatZodError(err) });
      return;
    }
    const message = err instanceof Error ? err.message : "Login failed";
    res.status(401).json({ success: false, message });
  }
};

export const totpSetup = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await setupTotp(req.preMfaStaffId!);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not start TOTP setup";
    res.status(400).json({ success: false, message });
  }
};

export const totpEnable = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = totpCodeSchema.parse({ body: req.body });
    const result = await enableTotp(req.preMfaStaffId!, parsed.body.code);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(422).json({ success: false, errors: formatZodError(err) });
      return;
    }
    const message = err instanceof Error ? err.message : "Could not enable TOTP";
    res.status(400).json({ success: false, message });
  }
};

export const totpVerify = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = totpCodeSchema.parse({ body: req.body });
    const result = await verifyTotpLogin(req.preMfaStaffId!, parsed.body.code);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(422).json({ success: false, errors: formatZodError(err) });
      return;
    }
    const message = err instanceof Error ? err.message : "Invalid code";
    res.status(401).json({ success: false, message });
  }
};

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    const staff = await getCurrentPlatformStaff(req.platformStaff!.staffId);
    res.status(200).json({ success: true, data: staff });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not fetch staff";
    res.status(404).json({ success: false, message });
  }
};
