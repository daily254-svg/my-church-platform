import { PrismaClient } from "@prisma/client";
import { CreateEventInput, RegisterEventInput } from "./event.validation";

const prisma = new PrismaClient();

export const createEvent = async (data: CreateEventInput) => {
  const event = await prisma.event.create({
    data: {
      title: data.title,
      date: data.date,
      time: data.time,
      type: data.type,
      accent: data.accent || "#1B3A7A",
      acceptRegistration: data.acceptRegistration,
      registrationTitle: data.registrationTitle ?? null,
      registrationDescription: data.registrationDescription ?? null,
      registrationFields: data.registrationFields ?? [],
    },
  });

  return event;
};

export const getAllEvents = async () => {
  const events = await prisma.event.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      registrations: {
        include: {
          user: true,
        },
      },
    },
  });

  return events;
};

export const deleteEvent = async (id: string) => {
  const event = await prisma.event.findUnique({
    where: { id },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  await prisma.event.delete({
    where: { id },
  });

  return event;
};

export const registerForEvent = async (data: RegisterEventInput, userId?: string) => {
  const event = await prisma.event.findUnique({
    where: { id: data.eventId },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  if (!event.acceptRegistration) {
    throw new Error("Registration is not enabled for this event");
  }

  const registration = await prisma.eventRegistration.create({
    data: {
      eventId: data.eventId,
      userId: userId ?? null,
      answers: data.answers,
    },
  });

  return registration;
};