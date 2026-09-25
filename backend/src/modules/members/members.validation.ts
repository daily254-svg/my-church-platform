import { z } from "zod";

export const inviteStaffSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    name: z.string().min(2).optional(),
    role: z.enum(["ADMIN", "PASTOR", "SECRETARY", "MEDIA"]),
  }),
});

export type InviteStaffInput = z.infer<typeof inviteStaffSchema>["body"];
