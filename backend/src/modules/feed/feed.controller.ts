import { Request, Response } from "express";
import {
  createPost as createPostService,
  getAllPosts as getAllPostsService,
  likePost as likePostService,
  addComment as addCommentService,
  getComments as getCommentsService,
  deletePost as deletePostService,
} from "./feed.service";
import { createPostSchema, createCommentSchema } from "./feed.validation";
import { ZodError, ZodIssue } from "zod";

const formatZodError = (err: ZodError) =>
  err.issues.map((e: ZodIssue) => ({ field: e.path.join("."), message: e.message }));

export const createPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createPostSchema.parse({ body: req.body });
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId || !userRole) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const result = await createPostService(parsed.body, userId, userRole);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(422).json({ success: false, errors: formatZodError(err) });
      return;
    }
    const message = err instanceof Error ? err.message : "Failed to create post";
    res.status(400).json({ success: false, message });
  }
};

export const getAllPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const result = await getAllPostsService(userId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch posts";
    res.status(400).json({ success: false, message });
  }
};

export const likePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const result = await likePostService(postId, userId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to like post";
    res.status(400).json({ success: false, message });
  }
};

export const addComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const parsed = createCommentSchema.parse({ body: req.body });
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const result = await addCommentService(postId, parsed.body.text, userId);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(422).json({ success: false, errors: formatZodError(err) });
      return;
    }
    const message = err instanceof Error ? err.message : "Failed to add comment";
    res.status(400).json({ success: false, message });
  }
};

export const getComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const result = await getCommentsService(postId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch comments";
    res.status(400).json({ success: false, message });
  }
};

export const deletePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId || !userRole) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const result = await deletePostService(postId, userId, userRole);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete post";
    res.status(400).json({ success: false, message });
  }
};