import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    phone: z.string().optional(),
    gender: z.string().optional(),
    ministry: z.string().optional(),
    requestedRole: z.enum(["MEMBER", "MEDIA", "PASTOR", "SECRETARY", "ADMIN"]).optional(),
    inviteCode: z.string().min(1, "A church invite code or link is required"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const totpCodeSchema = z.object({
  body: z.object({
    code: z.string().min(6, "Code must be 6 digits").max(6, "Code must be 6 digits"),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
export type TotpCodeInput = z.infer<typeof totpCodeSchema>["body"];