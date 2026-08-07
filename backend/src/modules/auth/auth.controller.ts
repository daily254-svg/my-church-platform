import fs from "fs";
import { Request, Response } from "express";
import { registerUser, loginUser, getCurrentUser, getRoleAvailability, savePushToken, updateAvatar as updateUserAvatar } from "./auth.service";
import { registerSchema, loginSchema } from "./auth.validation";
import { ZodError, ZodIssue } from "zod";
import prisma from "../../config/db";
import { uploadImage } from "../../config/cloudinary";

const formatZodError = (err: ZodError) =>
  err.issues.map((e: ZodIssue) => ({ field: e.path.join("."), message: e.message }));

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = registerSchema.parse({ body: req.body });
    const result = await registerUser(parsed.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(422).json({ success: false, errors: formatZodError(err) });
      return;
    }
    const message = err instanceof Error ? err.message : "Registration failed";
    res.status(400).json({ success: false, message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = loginSchema.parse({ body: req.body });
    const result = await loginUser(parsed.body);
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

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    // req.user is attached by auth middleware
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const user = await getCurrentUser(userId);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not fetch user";
    res.status(404).json({ success: false, message });
  }
};

export const roleAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getRoleAvailability();
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not fetch role availability";
    res.status(500).json({ success: false, message });
  }
};

export const updatePushToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId
    const { token } = req.body
    if (!token) {
      res.status(400).json({ success: false, message: 'Token is required' })
      return
    }
    await savePushToken(userId, token)
    res.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save token'
    res.status(400).json({ success: false, message })
  }
}

export const updateAvatar = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'No image file provided' });
      return;
    }

    const folder = process.env.CLOUDINARY_FOLDER || "my-church-platform";
    const uploadResult = await uploadImage(req.file.path, folder);
    fs.unlink(req.file.path, () => {});

    const avatarUrl = uploadResult.secure_url;
    const user = await updateUserAvatar(userId, avatarUrl);

    res.json({ success: true, data: user });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update avatar';
    res.status(400).json({ success: false, message });
  }
};

export const validateRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { role: expectedRole } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    if (!user || user.role !== expectedRole) {
      res.status(403).json({ 
        success: false, 
        message: `Role mismatch. You are registered as ${user?.role}` 
      });
      return;
    }
    
    res.json({ success: true, role: user.role });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Validation failed' });
  }
};