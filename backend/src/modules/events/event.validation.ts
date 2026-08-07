import { z } from "zod";

const registrationFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["text", "email", "tel", "textarea", "number"]),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
});

export const createEventSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    date: z.string().min(1, "Date is required"),
    time: z.string().min(1, "Time is required"),
    type: z.string().min(1, "Type is required"),
    accent: z.string().optional().default("#1B3A7A"),
    acceptRegistration: z.boolean().optional().default(false),
    registrationTitle: z.string().optional().nullable(),
    registrationDescription: z.string().optional().nullable(),
    registrationFields: z.array(registrationFieldSchema).optional().default([]),
  }),
});

export const registerEventSchema = z.object({
  body: z.object({
    eventId: z.string().min(1, "Event is required"),
    answers: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])),
  }),
});

export type CreateEventInput = z.infer<typeof createEventSchema>["body"];
export type RegisterEventInput = z.infer<typeof registerEventSchema>["body"];