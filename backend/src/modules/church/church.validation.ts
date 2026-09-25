import { z } from "zod";

export const registerChurchSchema = z.object({
  body: z.object({
    churchName: z.string().min(2, "Church name must be at least 2 characters"),
    country: z.string().optional(),
    requireApproval: z.boolean().optional(),
    adminName: z.string().min(2, "Name must be at least 2 characters"),
    adminEmail: z.string().email("Invalid email address"),
    adminPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
  }),
});

export const createBranchSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Branch name must be at least 2 characters"),
    country: z.string().optional(),
    requireApproval: z.boolean().optional(),
    adminName: z.string().min(2, "Name must be at least 2 characters"),
    adminEmail: z.string().email("Invalid email address"),
    adminPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
  }),
});

export type RegisterChurchInput = z.infer<typeof registerChurchSchema>["body"];
export type CreateBranchInput = z.infer<typeof createBranchSchema>["body"];
