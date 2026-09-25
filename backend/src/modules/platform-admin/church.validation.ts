import { z } from "zod";

export const createChurchSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    country: z.string().optional(),
    parentChurchId: z.string().uuid().optional(),
    requireApproval: z.boolean().optional(),
  }),
});

export type CreateChurchInput = z.infer<typeof createChurchSchema>["body"];
