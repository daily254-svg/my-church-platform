import { z } from "zod";

// All versions served locally.
// Add new versions here when the corresponding JSON file is added.
const ALL_VERSIONS = ["kjv", "nkjv", "amp", "niv", "esv", "nlt", "nasb1995", "csb"] as const;

export type BibleVersion = (typeof ALL_VERSIONS)[number];

export const scriptureSearchSchema = z.object({
  query:   z.string().min(1, "search query is required"),
  version: z.enum(ALL_VERSIONS).default("kjv"),
  limit:   z.coerce.number().int().min(1).max(100).default(20),
});

export const scriptureReferenceSchema = z.object({
  reference: z.string().min(1, "reference is required"),
  version:   z.enum(ALL_VERSIONS).default("kjv"),
});

export const scriptureCompareSchema = z.object({
  reference: z.string().min(1, "reference is required"),
});

export const scriptureVerseCountSchema = z.object({
  book:    z.string().min(1, "book is required"),
  chapter: z.coerce.number().int().min(1),
  version: z.enum(ALL_VERSIONS).default("kjv"),
});

export const scriptureBooksSchema = z.object({
  version: z.enum(ALL_VERSIONS).default("kjv"),
});

// Returns parsed data or throws a clean message
export const validate = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const msg = result.error.issues.map((i) => i.message).join(", ");
    throw new Error(`Validation failed: ${msg}`);
  }
  return result.data;
};