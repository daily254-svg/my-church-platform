import crypto from "crypto";
import prisma from "../config/db";

export const slugify = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const generateInviteCode = (): string => crypto.randomBytes(6).toString("hex");

export const generateUniqueChurchSlug = async (name: string): Promise<string> => {
  const base = slugify(name) || "church";
  let slug = base;
  let attempt = 0;
  while (await prisma.church.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
  return slug;
};
