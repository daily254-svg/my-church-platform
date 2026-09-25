import bcrypt from "bcrypt";
import prisma from "../../config/db";
import { generateToken } from "../../utils/jwt";
import { createChurch } from "../platform-admin/church.service";
import { RegisterChurchInput } from "./church.validation";

const SALT_ROUNDS = 12;

// Self-serve signup: creates the church (pending platform-admin approval,
// on a 30-day trial) and its first admin in one step, then logs them in.
// Never accepts a parentChurchId here — branches are created by an existing
// church admin from inside their own dashboard, not by an anonymous signup.
export const registerChurch = async (data: RegisterChurchInput) => {
  const existingAdmin = await prisma.user.findUnique({ where: { email: data.adminEmail } });
  if (existingAdmin) {
    throw new Error("An account with this email already exists");
  }

  const church = await createChurch({
    name: data.churchName,
    country: data.country,
    requireApproval: data.requireApproval,
  });

  const hashedPassword = await bcrypt.hash(data.adminPassword, SALT_ROUNDS);

  const admin = await prisma.user.create({
    data: {
      name: data.adminName,
      email: data.adminEmail,
      password: hashedPassword,
      role: "ADMIN",
      status: "ACTIVE",
      churchId: church.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      churchId: true,
      createdAt: true,
    },
  });

  const token = generateToken({
    userId: admin.id,
    email: admin.email,
    role: admin.role,
    churchId: admin.churchId,
  });

  return { church, user: admin, token };
};
