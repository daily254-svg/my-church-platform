import { z } from "zod";

export const platformLoginSchema = z.object({
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

export type PlatformLoginInput = z.infer<typeof platformLoginSchema>["body"];
export type TotpCodeInput = z.infer<typeof totpCodeSchema>["body"];
