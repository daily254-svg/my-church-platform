import { PrismaClient } from "@prisma/client";
import { sendEmail } from "../../services/email.service";
import { generateSecureToken } from "../../utils/token";
import { CHURCH_ADMIN_URL } from "../../config/env";

const prisma = new PrismaClient();

const INVITE_EXPIRY_DAYS = 7;

const PENDING_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  ministry: true,
  role: true,
  requestedRole: true,
  status: true,
  createdAt: true,
} as const;

export const listPendingMembers = async (churchId: string) => {
  return prisma.user.findMany({
    where: { churchId, status: "PENDING" },
    select: PENDING_SELECT,
    orderBy: { createdAt: "asc" },
  });
};

export const listActiveMembers = async (churchId: string) => {
  return prisma.user.findMany({
    where: { churchId, status: "ACTIVE" },
    select: PENDING_SELECT,
    orderBy: { name: "asc" },
  });
};

export const approveMember = async (userId: string, churchId: string) => {
  const user = await prisma.user.findFirst({ where: { id: userId, churchId } });
  if (!user) {
    throw new Error("Member not found");
  }
  if (user.status !== "PENDING") {
    throw new Error(`Cannot approve a member with status ${user.status}`);
  }

  // Approving someone who requested an elevated role also grants it.
  return prisma.user.update({
    where: { id: userId },
    data: {
      status: "ACTIVE",
      ...(user.requestedRole && { role: user.requestedRole, requestedRole: null }),
    },
    select: PENDING_SELECT,
  });
};

export const rejectMember = async (userId: string, churchId: string) => {
  const user = await prisma.user.findFirst({ where: { id: userId, churchId } });
  if (!user) {
    throw new Error("Member not found");
  }
  if (user.status !== "PENDING") {
    throw new Error(`Cannot reject a member with status ${user.status}`);
  }

  return prisma.user.update({
    where: { id: userId },
    data: { status: "REJECTED" },
    select: PENDING_SELECT,
  });
};

// Shared by self-service leave and admin "mark as left" — history (givings,
// prayers, posts, sermon notes) stays put since it already carries its own
// churchId, not derived from the user's current membership.
export const leaveChurch = async (userId: string, churchId: string) => {
  const user = await prisma.user.findFirst({ where: { id: userId, churchId } });
  if (!user) {
    throw new Error("Member not found");
  }
  if (user.status !== "ACTIVE") {
    throw new Error(`Cannot leave/remove a member with status ${user.status}`);
  }

  await prisma.ministryMember.deleteMany({ where: { userId } });

  return prisma.user.update({
    where: { id: userId },
    data: { status: "LEFT" },
    select: PENDING_SELECT,
  });
};

// ── Staff invites ───────────────────────────────────────────────────

const INVITE_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  expiresAt: true,
  createdAt: true,
} as const;

export const listPendingInvites = async (churchId: string) => {
  return prisma.staffInvite.findMany({
    where: { churchId, status: "PENDING" },
    select: INVITE_SELECT,
    orderBy: { createdAt: "desc" },
  });
};

export const inviteStaff = async (
  churchId: string,
  invitedById: string,
  data: { email: string; name?: string; role: "ADMIN" | "PASTOR" | "SECRETARY" | "MEDIA" },
) => {
  const church = await prisma.church.findUnique({ where: { id: churchId } });
  if (!church) {
    throw new Error("Church not found");
  }

  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw new Error("An account with this email already exists");
  }

  const existingInvite = await prisma.staffInvite.findUnique({
    where: { churchId_email_status: { churchId, email: data.email, status: "PENDING" } },
  });
  if (existingInvite) {
    throw new Error("An invite is already pending for this email");
  }

  const token = generateSecureToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

  const invite = await prisma.staffInvite.create({
    data: {
      churchId,
      email: data.email,
      name: data.name ?? null,
      role: data.role,
      token,
      invitedById,
      expiresAt,
    },
    select: INVITE_SELECT,
  });

  const acceptUrl = CHURCH_ADMIN_URL
    ? `${CHURCH_ADMIN_URL}/accept-invite?token=${token}`
    : null;

  await sendEmail({
    to: data.email,
    toName: data.name,
    subject: `You've been invited to join ${church.name} on My Church Platform`,
    htmlContent: `
      <p>Hi ${data.name || "there"},</p>
      <p>You've been invited to join <strong>${church.name}</strong> as <strong>${data.role}</strong>.</p>
      ${acceptUrl ? `<p><a href="${acceptUrl}">Accept your invite</a></p>` : ""}
      <p>Or open the church admin panel and enter this invite code manually:</p>
      <p style="font-family: monospace; font-size: 16px;">${token}</p>
      <p>This invite expires in ${INVITE_EXPIRY_DAYS} days.</p>
    `,
  });

  return invite;
};

export const revokeInvite = async (inviteId: string, churchId: string) => {
  const invite = await prisma.staffInvite.findFirst({ where: { id: inviteId, churchId } });
  if (!invite) {
    throw new Error("Invite not found");
  }
  if (invite.status !== "PENDING") {
    throw new Error(`Cannot revoke an invite with status ${invite.status}`);
  }

  return prisma.staffInvite.update({
    where: { id: inviteId },
    data: { status: "REVOKED" },
    select: INVITE_SELECT,
  });
};
