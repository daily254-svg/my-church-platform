import { Request, Response } from "express";
import {
  createEvent as createEventService,
  getAllEvents as getAllEventsService,
  deleteEvent as deleteEventService,
  registerForEvent as registerForEventService,
} from "./event.service";
import { createEventSchema, registerEventSchema } from "./event.validation";
import { ZodError, ZodIssue } from "zod";

const formatZodError = (err: ZodError) =>
  err.issues.map((e: ZodIssue) => ({ field: e.path.join("."), message: e.message }));

export const createEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createEventSchema.parse({ body: req.body });
    const churchId = req.user?.churchId;
    if (!churchId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const result = await createEventService(parsed.body, churchId);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(422).json({ success: false, errors: formatZodError(err) });
      return;
    }
    const message = err instanceof Error ? err.message : "Failed to create event";
    res.status(400).json({ success: false, message });
  }
};

export const getAllEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const churchId = req.user?.churchId;
    if (!churchId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const result = await getAllEventsService(churchId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch events";
    res.status(400).json({ success: false, message });
  }
};

export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const churchId = req.user?.churchId;
    if (!churchId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const result = await deleteEventService(id, churchId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete event";
    res.status(400).json({ success: false, message });
  }
};

export const registerForEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = registerEventSchema.parse({ body: req.body });
    const churchId = req.user?.churchId;
    if (!churchId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const result = await registerForEventService(parsed.body, churchId, req.user?.userId);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(422).json({ success: false, errors: formatZodError(err) });
      return;
    }
    const message = err instanceof Error ? err.message : "Failed to register for event";
    res.status(400).json({ success: false, message });
  }
};