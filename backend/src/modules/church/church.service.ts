import bcrypt from "bcrypt";
import prisma from "../../config/db";
import { generateToken } from "../../utils/jwt";
import { createChurch } from "../platform-admin/church.service";
import { generateUniqueChurchSlug, generateInviteCode } from "../../utils/slug";
import { provisionDefaultMinistryGroups } from "../ministry/ministry.service";
import { RegisterChurchInput, CreateBranchInput } from "./church.validation";

const SALT_ROUNDS = 12;

// Self-serve signup: creates the church (pending platform-admin approval,
// on a 30-day trial) and its first admin in one step, then logs them in.
// Never accepts a parentChurchId here — branches are created by an existing
// church admin from inside their own dashboard, not by an anonymous signup.
export const registerChurch = async (data: RegisterChurchInput) => {
  const existingAdmin = await prisma.user.findUnique({ where: { email: data.adminEmail } });
  if (existingAdmin) {
    throw new Error("An account with this email already exists");
  }

  const church = await createChurch({
    name: data.churchName,
    country: data.country,
    requireApproval: data.requireApproval,
  });

  const hashedPassword = await bcrypt.hash(data.adminPassword, SALT_ROUNDS);

  const admin = await prisma.user.create({
    data: {
      name: data.adminName,
      email: data.adminEmail,
      password: hashedPassword,
      role: "ADMIN",
      status: "ACTIVE",
      churchId: church.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      churchId: true,
      createdAt: true,
    },
  });

  const token = generateToken({
    userId: admin.id,
    email: admin.email,
    role: admin.role,
    churchId: admin.churchId,
  });

  return { church, user: admin, token };
};

// Creates a branch under the calling admin's own church. Unlike
// registerChurch (anonymous, needs platform-admin approval), the mother
// church is already vetted — a branch it creates is ACTIVE immediately.
export const createBranch = async (motherChurchId: string, data: CreateBranchInput) => {
  const mother = await prisma.church.findUnique({
    where: { id: motherChurchId },
    include: { subscription: { include: { plan: true } }, branches: true },
  });
  if (!mother) {
    throw new Error("Church not found");
  }
  if (mother.parentChurchId) {
    throw new Error("A branch cannot have its own branches");
  }
  if (!mother.subscription) {
    throw new Error("Your church has no subscription on record");
  }
  if (mother.branches.length >= mother.subscription.plan.maxBranches) {
    throw new Error(
      `Branch limit reached for your plan (max ${mother.subscription.plan.maxBranches}) — upgrade your plan to add more`,
    );
  }

  const existingAdmin = await prisma.user.findUnique({ where: { email: data.adminEmail } });
  if (existingAdmin) {
    throw new Error("An account with this email already exists");
  }

  const slug = await generateUniqueChurchSlug(data.name);
  const inviteCode = generateInviteCode();

  const branch = await prisma.church.create({
    data: {
      name: data.name,
      slug,
      inviteCode,
      country: data.country ?? null,
      requireApproval: data.requireApproval ?? false,
      parentChurchId: motherChurchId,
      status: "ACTIVE",
    },
  });

  await provisionDefaultMinistryGroups(branch.id);

  const hashedPassword = await bcrypt.hash(data.adminPassword, SALT_ROUNDS);
  const admin = await prisma.user.create({
    data: {
      name: data.adminName,
      email: data.adminEmail,
      password: hashedPassword,
      role: "ADMIN",
      status: "ACTIVE",
      churchId: branch.id,
    },
    select: { id: true, name: true, email: true, role: true, churchId: true, createdAt: true },
  });

  return { branch, admin };
};

export const listBranches = async (motherChurchId: string) => {
  return prisma.church.findMany({
    where: { parentChurchId: motherChurchId },
    orderBy: { createdAt: "desc" },
  });
};
