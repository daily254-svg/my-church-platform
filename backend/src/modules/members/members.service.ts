import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
