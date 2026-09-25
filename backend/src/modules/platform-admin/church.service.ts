import prisma from "../../config/db";
import { generateUniqueChurchSlug, generateInviteCode } from "../../utils/slug";
import { provisionDefaultMinistryGroups } from "../ministry/ministry.service";
import { emailChurchExport } from "./church-export.service";
import { CreateChurchInput } from "./church.validation";

const TRIAL_DAYS = 30;
const DELETION_GRACE_DAYS = 14;

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

  await provisionDefaultMinistryGroups(church.id);

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
  // CANCELLED -> ACTIVE undoes a cancellation within the 14-day grace
  // period — the whole point of not deleting immediately.
  if (church.status !== "SUSPENDED" && church.status !== "CANCELLED") {
    throw new Error(`Cannot reactivate a church with status ${church.status}`);
  }
  await prisma.church.update({ where: { id }, data: { status: "ACTIVE", cancelledAt: null } });
  return getChurchById(id);
};

export const cancelChurch = async (id: string) => {
  const church = await prisma.church.findUnique({ where: { id } });
  if (!church) throw new Error("Church not found");
  if (church.status === "CANCELLED") {
    throw new Error("Church is already cancelled");
  }
  await prisma.church.update({ where: { id }, data: { status: "CANCELLED", cancelledAt: new Date() } });

  // Best-effort — cancellation succeeds even if the export email fails;
  // it can be re-triggered manually via exportNow.
  emailChurchExport(id).catch((err) => console.error(`[export] Failed to email export for church ${id}:`, err));

  return getChurchById(id);
};

export const exportNow = async (id: string) => {
  const church = await prisma.church.findUnique({ where: { id } });
  if (!church) throw new Error("Church not found");
  await emailChurchExport(id);
  return getChurchById(id);
};

export const listDeletionQueue = async () => {
  const cancelled = await prisma.church.findMany({
    where: { status: "CANCELLED" },
    include: { branches: { select: { id: true } } },
    orderBy: { cancelledAt: "asc" },
  });

  return cancelled.map((church) => {
    const cancelledAt = church.cancelledAt!;
    const deletesAt = new Date(cancelledAt);
    deletesAt.setDate(deletesAt.getDate() + DELETION_GRACE_DAYS);
    const daysRemaining = Math.max(0, Math.ceil((deletesAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    return {
      id: church.id,
      name: church.name,
      cancelledAt,
      deletesAt,
      daysRemaining,
      blockedByBranches: church.branches.length > 0,
    };
  });
};

// Permanently deletes any church cancelled 14+ days ago. Skips (and
// reports) mother churches that still have branches attached — deleting
// those branches as a side effect of the mother's cancellation is a policy
// call nobody's made yet, so it's left for manual handling instead.
export const processDueDeletions = async () => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DELETION_GRACE_DAYS);

  const due = await prisma.church.findMany({
    where: { status: "CANCELLED", cancelledAt: { lte: cutoff } },
    include: { branches: { select: { id: true } } },
  });

  const deleted: { id: string; name: string }[] = [];
  const skipped: { id: string; name: string; reason: string }[] = [];

  for (const church of due) {
    if (church.branches.length > 0) {
      skipped.push({ id: church.id, name: church.name, reason: "still has branches attached" });
      continue;
    }
    await prisma.church.delete({ where: { id: church.id } });
    deleted.push({ id: church.id, name: church.name });
    console.log(`[deletion] Permanently deleted church ${church.id} (${church.name}) — cancelled ${DELETION_GRACE_DAYS}+ days ago`);
  }

  return { deleted, skipped };
};
