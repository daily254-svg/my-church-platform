import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { generateToken } from "../../utils/jwt";
import { RegisterInput, LoginInput } from "./auth.validation";

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

export const registerUser = async (data: RegisterInput) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const church = await prisma.church.findUnique({ where: { inviteCode: data.inviteCode } });
  if (!church) {
    throw new Error("Invalid invite code or link");
  }
  if (church.status !== "ACTIVE") {
    throw new Error("This church isn't accepting new members right now");
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  // Role is always MEMBER on self-registration — never trust client input
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      phone: data.phone ?? null,
      gender: data.gender ?? null,
      ministry: data.ministry ?? null,
      requestedRole: data.requestedRole ?? null,
      role: "MEMBER",
      status: church.requireApproval || data.requestedRole ? "PENDING" : "ACTIVE",
      churchId: church.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      ministry: true,
      role: true,
      churchId: true,
      createdAt: true,
    },
  });

  const token = generateToken({ userId: user.id, email: user.email, role: user.role, churchId: user.churchId });

  return { user, token };
};

export const loginUser = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    // Generic message — don't reveal whether email exists
    throw new Error("Invalid email or password");
  }

  const passwordMatch = await bcrypt.compare(data.password, user.password);
  if (!passwordMatch) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken({ userId: user.id, email: user.email, role: user.role, churchId: user.churchId });

  const { password: _pw, ...safeUser } = user;
  return { user: safeUser, token };
};

export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      ministry: true,
      role: true,
      churchId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

const ROLE_AVAILABILITY_ROLES = ["PASTOR", "MEDIA", "SECRETARY"] as const;

type RoleAvailability = {
  PASTOR: { taken: boolean };
  MEDIA: { taken: boolean };
  SECRETARY: { taken: boolean };
};

// Scoped per church — a taken PASTOR seat in one church says nothing about another.
export const getRoleAvailability = async (inviteCode: string): Promise<RoleAvailability> => {
  const church = await prisma.church.findUnique({ where: { inviteCode } });
  if (!church) {
    throw new Error("Invalid invite code or link");
  }

  const counts = await Promise.all(
    ROLE_AVAILABILITY_ROLES.map((role) =>
      prisma.user.count({
        where: {
          churchId: church.id,
          OR: [
            { role },
            { requestedRole: role },
          ],
        },
      }),
    ),
  );

  return {
    PASTOR: { taken: counts[0] > 0 },
    MEDIA: { taken: counts[1] > 0 },
    SECRETARY: { taken: counts[2] > 0 },
  };
};

export const savePushToken = async (userId: string, token: string) => {
  return prisma.user.update({
    where: { id: userId },
    data:  { pushToken: token },
  })
}

export const updateAvatar = async (userId: string, avatarUrl: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
  });
};