import prisma from "../../config/db";
import { CreatePlanInput, UpdatePlanInput } from "./plan.validation";

export const listPlans = async () => {
  return prisma.plan.findMany({ orderBy: { maxBranches: "asc" } });
};

export const createPlan = async (data: CreatePlanInput) => {
  const existing = await prisma.plan.findUnique({ where: { slug: data.slug } });
  if (existing) throw new Error("A plan with this slug already exists");
  return prisma.plan.create({ data });
};

export const updatePlan = async (id: string, data: UpdatePlanInput) => {
  const plan = await prisma.plan.findUnique({ where: { id } });
  if (!plan) throw new Error("Plan not found");
  return prisma.plan.update({ where: { id }, data });
};
