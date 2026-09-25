import prisma from "../../config/db";

const getMotherChurchSubscription = async (churchId: string) => {
  const church = await prisma.church.findUnique({
    where: { id: churchId },
    include: { subscription: true, branches: true },
  });
  if (!church) throw new Error("Church not found");
  if (church.parentChurchId) throw new Error("Branches don't carry their own subscription — manage it on the mother church");
  if (!church.subscription) throw new Error("This church has no subscription on record");
  return church;
};

export const assignPlan = async (churchId: string, planId: string) => {
  const church = await getMotherChurchSubscription(churchId);
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new Error("Plan not found");
  if (church.branches.length > plan.maxBranches) {
    throw new Error(
      `This church has ${church.branches.length} branches — the "${plan.name}" plan only allows ${plan.maxBranches}`,
    );
  }

  return prisma.subscription.update({
    where: { churchId },
    data: { planId },
    include: { plan: true },
  });
};

export const changeSubscriptionStatus = async (churchId: string, status: string) => {
  await getMotherChurchSubscription(churchId);
  return prisma.subscription.update({
    where: { churchId },
    data: { status: status as any },
    include: { plan: true },
  });
};

export const getSubscription = async (churchId: string) => {
  const church = await getMotherChurchSubscription(churchId);
  return prisma.subscription.findUnique({ where: { churchId }, include: { plan: true } });
};
