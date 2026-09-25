import { PrismaClient } from "@prisma/client";
import { CreatePrayerInput } from "./prayer.validation";

const prisma = new PrismaClient();

export const createPrayer = async (data: CreatePrayerInput, userId: string, churchId: string) => {
  const prayer = await prisma.prayer.create({
    data: {
      churchId,
      text: data.text,
      category: data.category || "Personal",
      isAnonymous: data.isAnonymous || false,
      userId,
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  return {
    ...prayer,
    user: prayer.isAnonymous ? { name: "Anonymous" } : prayer.user,
  };
};

export const getAllPrayers = async (churchId: string) => {
  const prayers = await prisma.prayer.findMany({
    where: { churchId },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      text: true,
      category: true,
      isAnonymous: true,
      prayerCount: true,
      createdAt: true,
      userId: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  return prayers.map((prayer) => ({
    ...prayer,
    user: prayer.isAnonymous ? { name: "Anonymous" } : prayer.user,
  }));
};

export const prayForRequest = async (id: string, churchId: string) => {
  const prayer = await prisma.prayer.findFirst({ where: { id, churchId } });
  if (!prayer) {
    throw new Error("Prayer request not found");
  }

  const updated = await prisma.prayer.update({
    where: { id },
    data: {
      prayerCount: {
        increment: 1,
      },
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  return {
    ...updated,
    user: updated.isAnonymous ? { name: "Anonymous" } : updated.user,
  };
};

export const deletePrayer = async (id: string, userId: string, churchId: string) => {
  const prayer = await prisma.prayer.findFirst({
    where: { id, churchId },
  });

  if (!prayer) {
    throw new Error("Prayer request not found");
  }

  if (prayer.userId !== userId) {
    throw new Error("Not authorized");
  }

  await prisma.prayer.delete({
    where: { id },
  });

  return prayer;
};
