import { PrismaClient } from "@prisma/client";
import { CreateAnnouncementInput } from "./announcement.validation";
import { sendToAll } from '../../services/push.service'

const prisma = new PrismaClient();

export const createAnnouncement = async (data: CreateAnnouncementInput, churchId: string) => {
  const announcement = await prisma.announcement.create({
    data: {
      churchId,
      title: data.title,
      body: data.body,
      category: data.category,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      isLive: false,
    },
  });

  return announcement;
};

export const getAllAnnouncements = async (churchId: string) => {
  const announcements = await prisma.announcement.findMany({
    where: { churchId },
    orderBy: { createdAt: "desc" },
  });

  return announcements;
};

export const sendAnnouncement = async (id: string, churchId: string) => {
  const announcement = await prisma.announcement.findFirst({
    where: { id, churchId },
  });

  if (!announcement) {
    throw new Error("Announcement not found");
  }

  const updatedAnnouncement = await prisma.announcement.update({
    where: { id },
    data: {
      isLive: true,
      sentAt: new Date(),
    },
  });

  // Send push notification to all active users in this church
  await sendToAll(prisma, churchId, {
    title: `📢 ${announcement.title}`,
    body:  announcement.body.slice(0, 100),
    data:  { type: 'announcement', id: announcement.id },
  });

  return updatedAnnouncement;
};

export const deleteAnnouncement = async (id: string, churchId: string) => {
  const existingAnnouncement = await prisma.announcement.findFirst({
    where: { id, churchId },
  });

  if (!existingAnnouncement) {
    throw new Error("Announcement not found");
  }

  await prisma.announcement.delete({
    where: { id },
  });

  return { message: "Announcement deleted successfully" };
};
