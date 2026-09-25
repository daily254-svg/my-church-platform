import { PrismaClient } from "@prisma/client";
import { CreateSermonInput, UpdateSermonInput } from "./sermon.validation";

const prisma = new PrismaClient();

export const createSermon = async (data: CreateSermonInput, pastorName: string, churchId: string) => {
  const sermon = await prisma.sermon.create({
    data: {
      churchId,
      title: data.title,
      description: data.description,
      scriptureList: data.scriptureList ?? [],
      queue: data.queue ?? [],
      status: "DRAFT",
    },
  });

  return sermon;
};

export const getAllSermons = async (churchId: string) => {
  const sermons = await prisma.sermon.findMany({
    where: { churchId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      scriptureList: true,
      queue: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return sermons;
};

export const getSermonById = async (id: string, churchId: string) => {
  const sermon = await prisma.sermon.findFirst({
    where: { id, churchId },
  });

  if (!sermon) {
    throw new Error("Sermon not found");
  }

  return sermon;
};

export const updateSermon = async (id: string, churchId: string, data: UpdateSermonInput) => {
  const existingSermon = await prisma.sermon.findFirst({
    where: { id, churchId },
  });

  if (!existingSermon) {
    throw new Error("Sermon not found");
  }

  const updatedSermon = await prisma.sermon.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.scriptureList !== undefined && { scriptureList: data.scriptureList }),
      ...(data.queue !== undefined && { queue: data.queue }),
    },
  });

  return updatedSermon;
};

export const updateSermonStatus = async (id: string, churchId: string, status: string) => {
  const existingSermon = await prisma.sermon.findFirst({
    where: { id, churchId },
  });

  if (!existingSermon) {
    throw new Error("Sermon not found");
  }

  const updatedSermon = await prisma.sermon.update({
    where: { id },
    data: {
      status: status as any,
    },
  });

  return updatedSermon;
};

export const deleteSermon = async (id: string, churchId: string) => {
  const existingSermon = await prisma.sermon.findFirst({
    where: { id, churchId },
  });

  if (!existingSermon) {
    throw new Error("Sermon not found");
  }

  await prisma.sermon.delete({
    where: { id },
  });

  return { message: "Sermon deleted successfully" };
};
