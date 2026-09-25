import { PrismaClient, GivingType } from '@prisma/client';
import { CreateGivingInput } from './giving.validation';
import { sendToUser } from '../../services/push.service';

const prisma = new PrismaClient();

export const createGiving = async (data: CreateGivingInput, userId: string, churchId: string) => {
  const result = await prisma.giving.create({
    data: {
      ...data,
      churchId,
      userId,
      status: 'CONFIRMED',
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  // Send push notification to the user
  await sendToUser(prisma, userId, {
    title: '🙏 Giving Received',
    body:  `Your ${data.category.toLowerCase()} of ₦${data.amount.toLocaleString()} has been recorded`,
    data:  { type: 'giving_confirmation' },
  });

  return result;
};

export const getUserGivings = async (userId: string) => {
  const givings = await prisma.giving.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      category: true,
      amount: true,
      reference: true,
      note: true,
      service: true,
      status: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return givings;
};

export const getAllGivings = async (churchId: string, filters?: {
  type?: string;
  search?: string;
}) => {
  const givings = await prisma.giving.findMany({
    where: {
      churchId,
      ...(filters?.type && { category: filters.type as GivingType }),
      ...(filters?.search && {
        user: {
          name: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
      }),
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return givings;
};

export const getGivingSummary = async (churchId: string) => {
  const givings = await prisma.giving.findMany({ where: { churchId } });

  const total = givings.reduce((sum, g) => sum + g.amount, 0);
  const titheTotal = givings
    .filter((g) => g.category === 'TITHE')
    .reduce((sum, g) => sum + g.amount, 0);
  const offeringTotal = givings
    .filter((g) => g.category !== 'TITHE')
    .reduce((sum, g) => sum + g.amount, 0);
  const count = givings.length;
  const titheCount = givings.filter((g) => g.category === 'TITHE').length;
  const offeringCount = count - titheCount;

  return {
    total,
    titheTotal,
    offeringTotal,
    count,
    titheCount,
    offeringCount,
  };
};
