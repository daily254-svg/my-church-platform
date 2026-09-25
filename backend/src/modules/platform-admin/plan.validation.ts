import { z } from "zod";

export const createPlanSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug must be lowercase, alphanumeric with dashes"),
    maxBranches: z.number().int().min(0),
    priceKES: z.number().nonnegative().optional(),
    priceUSD: z.number().nonnegative().optional(),
  }),
});

export const updatePlanSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    maxBranches: z.number().int().min(0).optional(),
    priceKES: z.number().nonnegative().optional(),
    priceUSD: z.number().nonnegative().optional(),
    isActive: z.boolean().optional(),
  }),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>["body"];
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>["body"];
