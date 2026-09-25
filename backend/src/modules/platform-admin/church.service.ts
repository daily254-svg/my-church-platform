import prisma from "../../config/db";
import { generateUniqueChurchSlug, generateInviteCode } from "../../utils/slug";
import { CreateChurchInput } from "./church.validation";

const TRIAL_DAYS = 30;

const churchInclude = {
  branches: { include: { subscription: { include: { plan: true } } } },
  subscription: { include: { plan: true } },
  parentChurch: { select: { id: true, name: true, slug: true } },
};

export const createChurch = async (input: CreateChurchInput) => {
  let parent = null;
  if (input.parentChurchId) {
    parent = await prisma.church.findUnique({
      where: { id: input.parentChurchId },
      include: { subscription: { include: { plan: true } }, branches: true },
    });
    if (!parent) throw new Error("Parent church not found");
    // Keep the hierarchy flat — a branch cannot itself have branches.
    if (parent.parentChurchId) throw new Error("A branch cannot have its own branches");
    if (!parent.subscription) throw new Error("Mother church has no subscription on record");
    if (parent.branches.length >= parent.subscription.plan.maxBranches) {
      throw new Error(
        `Branch limit reached for this church's plan (max ${parent.subscription.plan.maxBranches})`,
      );
    }
  }

  const slug = await generateUniqueChurchSlug(input.name);
  const inviteCode = generateInviteCode();

  const church = await prisma.church.create({
    data: {
      name: input.name,
      slug,
      inviteCode,
      country: input.country ?? null,
      requireApproval: input.requireApproval ?? false,
      parentChurchId: input.parentChurchId ?? null,
      status: "PENDING_APPROVAL",
    },
  });

  // Branches are covered by the mother church's subscription — only a
  // top-level church gets its own Subscription row.
  if (!input.parentChurchId) {
    const basicPlan = await prisma.plan.findUnique({ where: { slug: "basic" } });
    if (!basicPlan) throw new Error("Default 'basic' plan has not been seeded");

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

    await prisma.subscription.create({
      data: {
        churchId: church.id,
        planId: basicPlan.id,
        status: "TRIALING",
        trialEndsAt,
      },
    });
  }

  return getChurchById(church.id);
};

export const listChurches = async () => {
  return prisma.church.findMany({
    where: { parentChurchId: null },
    include: churchInclude,
    orderBy: { createdAt: "desc" },
  });
};

export const getChurchById = async (id: string) => {
  const church = await prisma.church.findUnique({ where: { id }, include: churchInclude });
  if (!church) throw new Error("Church not found");
  return church;
};

export const approveChurch = async (id: string) => {
  const church = await prisma.church.findUnique({ where: { id } });
  if (!church) throw new Error("Church not found");
  if (church.status !== "PENDING_APPROVAL") {
    throw new Error(`Cannot approve a church with status ${church.status}`);
  }
  await prisma.church.update({ where: { id }, data: { status: "ACTIVE" } });
  return getChurchById(id);
};

export const suspendChurch = async (id: string) => {
  const church = await prisma.church.findUnique({ where: { id } });
  if (!church) throw new Error("Church not found");
  if (church.status !== "ACTIVE") {
    throw new Error(`Cannot suspend a church with status ${church.status}`);
  }
  await prisma.church.update({ where: { id }, data: { status: "SUSPENDED" } });
  return getChurchById(id);
};

export const reactivateChurch = async (id: string) => {
  const church = await prisma.church.findUnique({ where: { id } });
  if (!church) throw new Error("Church not found");
  if (church.status !== "SUSPENDED") {
    throw new Error(`Cannot reactivate a church with status ${church.status}`);
  }
  await prisma.church.update({ where: { id }, data: { status: "ACTIVE" } });
  return getChurchById(id);
};

export const cancelChurch = async (id: string) => {
  const church = await prisma.church.findUnique({ where: { id } });
  if (!church) throw new Error("Church not found");
  if (church.status === "CANCELLED") {
    throw new Error("Church is already cancelled");
  }
  // Data export + the 14-day deferred deletion job are wired up separately;
  // this just starts the clock by flipping status.
  await prisma.church.update({ where: { id }, data: { status: "CANCELLED" } });
  return getChurchById(id);
};
