import { z } from 'zod';

export const sendMessageSchema = z.object({
  body: z.object({
    text: z.string().min(1, "Message cannot be empty"),
  }),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const createGroupSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
    accent: z.string().optional(),
    imageUrl: z.string().optional(),
  }),
});

export const updateGroupSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    accent: z.string().optional(),
    imageUrl: z.string().optional(),
  }),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>['body'];
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>['body'];