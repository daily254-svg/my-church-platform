import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { generateToken, generatePreMfaToken } from "../../utils/jwt";
import { generateTotpSecret, buildTotpQrCode, verifyTotpCode } from "../../utils/totp";
import { RegisterInput, LoginInput } from "./auth.validation";

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

// Leadership roles that manage a church's data — MFA is required for these,
// not for ordinary MEMBER accounts (mobile app users), matching the same
// distinction platform-admin already enforces.
const STAFF_ROLES = ["ADMIN", "PASTOR", "SECRETARY", "MEDIA"] as const;

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

  if (user.status === "SUSPENDED" || user.status === "REJECTED" || user.status === "LEFT") {
    throw new Error("This account no longer has access to the platform");
  }

  const passwordMatch = await bcrypt.compare(data.password, user.password);
  if (!passwordMatch) {
    throw new Error("Invalid email or password");
  }

  if (STAFF_ROLES.includes(user.role as (typeof STAFF_ROLES)[number])) {
    const preMfaToken = generatePreMfaToken(user.id);
    return { preMfaToken, mfaSetupRequired: !user.totpEnabled };
  }

  const token = generateToken({ userId: user.id, email: user.email, role: user.role, churchId: user.churchId });

  const { password: _pw, ...safeUser } = user;
  return { user: safeUser, token };
};

export const acceptStaffInvite = async (token: string, password: string) => {
  const invite = await prisma.staffInvite.findUnique({ where: { token } });
  if (!invite || invite.status !== "PENDING") {
    throw new Error("Invalid or already-used invite");
  }
  if (invite.expiresAt < new Date()) {
    throw new Error("This invite has expired");
  }

  const existing = await prisma.user.findUnique({ where: { email: invite.email } });
  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const [user] = await prisma.$transaction([
    prisma.user.create({
      data: {
        name: invite.name,
        email: invite.email,
        password: hashedPassword,
        role: invite.role,
        status: "ACTIVE",
        churchId: invite.churchId,
      },
      select: { id: true, name: true, email: true, role: true, churchId: true, createdAt: true },
    }),
    prisma.staffInvite.update({ where: { id: invite.id }, data: { status: "ACCEPTED" } }),
  ]);

  // No token here — staff logins always go through the normal MFA-gated
  // /auth/login flow, invite acceptance is not an exception to that.
  return user;
};

export const setupTotp = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("Account not found");
  }
  if (user.totpEnabled) {
    throw new Error("MFA is already enabled on this account");
  }

  const secret = generateTotpSecret();
  await prisma.user.update({ where: { id: userId }, data: { totpSecret: secret } });

  const qrCode = await buildTotpQrCode(user.email, secret);
  return { secret, qrCode };
};

export const enableTotp = async (userId: string, code: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.totpSecret) {
    throw new Error("Run TOTP setup first");
  }

  const valid = await verifyTotpCode(code, user.totpSecret);
  if (!valid) {
    throw new Error("Invalid code");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { totpEnabled: true },
  });

  const token = generateToken({ userId: updated.id, email: updated.email, role: updated.role, churchId: updated.churchId });
  const { password: _pw, ...safeUser } = updated;
  return { token, user: safeUser };
};

export const verifyTotpLogin = async (userId: string, code: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.totpEnabled || !user.totpSecret) {
    throw new Error("MFA is not set up on this account");
  }

  const valid = await verifyTotpCode(code, user.totpSecret);
  if (!valid) {
    throw new Error("Invalid code");
  }

  const token = generateToken({ userId: user.id, email: user.email, role: user.role, churchId: user.churchId });
  const { password: _pw, ...safeUser } = user;
  return { token, user: safeUser };
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