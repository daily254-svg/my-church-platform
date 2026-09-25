import { PrismaClient } from '@prisma/client';
import { broadcastMinistryMessage } from '../../sockets/ministry.events';
import { Server as SocketServer } from 'socket.io';
import { CreateGroupInput, UpdateGroupInput } from './ministry.validation';

const prisma = new PrismaClient();

const DEFAULT_MINISTRY_GROUPS = [
  { name: 'Youth Ministry', description: 'Empowering the next generation', accent: '#F59E0B' },
  { name: 'Worship Team', description: 'Leading hearts into worship', accent: '#8B5CF6' },
  { name: 'Media Team', description: "Capturing and sharing God's glory", accent: '#10B981' },
  { name: 'Men Fellowship', description: 'Brothers standing firm in faith', accent: '#1B3A7A' },
  { name: 'Women Fellowship', description: 'Women of valor, grace and strength', accent: '#EC4899' },
  { name: 'Children Ministry', description: 'Nurturing young hearts for Christ', accent: '#F97316' },
];

// Called once when a church is created — gives every new church a sensible
// starting set of ministries instead of launching with none.
export const provisionDefaultMinistryGroups = async (churchId: string) => {
  await prisma.ministryGroup.createMany({
    data: DEFAULT_MINISTRY_GROUPS.map((group) => ({ ...group, churchId })),
  });
};

export const createGroup = async (churchId: string, data: CreateGroupInput) => {
  const existing = await prisma.ministryGroup.findUnique({
    where: { churchId_name: { churchId, name: data.name } },
  });
  if (existing) {
    throw new Error('A ministry with this name already exists');
  }

  return prisma.ministryGroup.create({
    data: {
      churchId,
      name: data.name,
      description: data.description ?? null,
      accent: data.accent ?? '#1B3A7A',
      imageUrl: data.imageUrl ?? null,
    },
  });
};

export const updateGroup = async (groupId: string, churchId: string, data: UpdateGroupInput) => {
  const group = await prisma.ministryGroup.findFirst({ where: { id: groupId, churchId } });
  if (!group) {
    throw new Error('Group not found');
  }

  return prisma.ministryGroup.update({
    where: { id: groupId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.accent !== undefined && { accent: data.accent }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
    },
  });
};

export const deleteGroup = async (groupId: string, churchId: string) => {
  const group = await prisma.ministryGroup.findFirst({ where: { id: groupId, churchId } });
  if (!group) {
    throw new Error('Group not found');
  }

  await prisma.ministryGroup.delete({ where: { id: groupId } });
  return { message: 'Ministry deleted successfully' };
};

export const getAllGroups = async (churchId: string) => {
  return prisma.ministryGroup.findMany({
    where: { churchId },
    select: {
      id: true,
      name: true,
      description: true,
      accent: true,
      imageUrl: true,
      createdAt: true,
      _count: {
        select: {
          members: true,
          messages: true,
        },
      },
    },
  });
};

export const getGroupById = async (groupId: string, churchId: string) => {
  const group = await prisma.ministryGroup.findFirst({
    where: { id: groupId, churchId },
    include: {
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  if (!group) {
    throw new Error('Group not found');
  }

  return group;
};

export const joinGroup = async (groupId: string, userId: string, churchId: string) => {
  const group = await prisma.ministryGroup.findFirst({
    where: { id: groupId, churchId },
  });

  if (!group) {
    throw new Error('Group not found');
  }

  await prisma.ministryMember.upsert({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
    update: {},
    create: {
      groupId,
      userId,
    },
  });

  return { joined: true };
};

export const leaveGroup = async (groupId: string, userId: string) => {
  await prisma.ministryMember.deleteMany({
    where: {
      groupId,
      userId,
    },
  });

  return { left: true };
};

export const getGroupMessages = async (groupId: string, churchId: string) => {
  const group = await prisma.ministryGroup.findFirst({
    where: { id: groupId, churchId },
  });

  if (!group) {
    throw new Error('Group not found');
  }

  return prisma.ministryMessage.findMany({
    where: { groupId },
    orderBy: {
      createdAt: 'asc',
    },
    take: 50,
    include: {
      user: {
        select: {
          name: true,
          role: true,
        },
      },
    },
  });
};

export const sendMessage = async (
  groupId: string,
  text: string,
  userId: string,
  churchId: string,
  io?: SocketServer
) => {
  const group = await prisma.ministryGroup.findFirst({
    where: { id: groupId, churchId },
  });

  if (!group) {
    throw new Error('Group not found');
  }

  // Check if user is a member of the group
  const membership = await prisma.ministryMember.findFirst({
    where: {
      groupId,
      userId,
    },
  });

  if (!membership) {
    throw new Error('You must join this group to send messages');
  }

  const message = await prisma.ministryMessage.create({
    data: {
      groupId,
      userId,
      text,
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  // Broadcast message to group room if io instance is available
  if (io && typeof broadcastMinistryMessage === 'function') {
    try {
      broadcastMinistryMessage(io as any, groupId, {
        id: message.id,
        text: message.text,
        createdAt: message.createdAt.toISOString(),
        user: {
          name: message.user.name || 'Unknown',
        },
      });
    } catch (error) {
      console.error('Failed to broadcast ministry message:', error);
    }
  }

  return message;
};

export const getUserGroups = async (userId: string) => {
  return prisma.ministryMember.findMany({
    where: { userId },
    include: {
      group: true,
    },
  });
};

export const isGroupMember = async (groupId: string, userId: string): Promise<boolean> => {
  const membership = await prisma.ministryMember.findFirst({
    where: {
      groupId,
      userId,
    },
  });

  return !!membership;
};
