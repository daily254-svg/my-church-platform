import { z } from "zod";

export const assignPlanSchema = z.object({
  body: z.object({
    planId: z.string().uuid(),
  }),
});

export const changeStatusSchema = z.object({
  body: z.object({
    status: z.enum(["TRIALING", "ACTIVE", "PAST_DUE", "DISABLED", "CANCELLED"]),
  }),
});

export type AssignPlanInput = z.infer<typeof assignPlanSchema>["body"];
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>["body"];
