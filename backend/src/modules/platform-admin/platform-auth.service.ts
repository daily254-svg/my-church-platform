import bcrypt from "bcrypt";
import prisma from "../../config/db";
import { generatePlatformToken, generatePreMfaToken } from "../../utils/platform-jwt";
import { generateTotpSecret, buildTotpQrCode, verifyTotpCode } from "../../utils/totp";
import { PlatformLoginInput } from "./platform-auth.validation";

const SALT_ROUNDS = 12;

export const loginPlatformStaff = async (data: PlatformLoginInput) => {
  const staff = await prisma.platformStaff.findUnique({ where: { email: data.email } });
  if (!staff) {
    throw new Error("Invalid email or password");
  }

  const passwordMatch = await bcrypt.compare(data.password, staff.password);
  if (!passwordMatch) {
    throw new Error("Invalid email or password");
  }

  const preMfaToken = generatePreMfaToken(staff.id);

  return {
    preMfaToken,
    mfaSetupRequired: !staff.totpEnabled,
  };
};

export const setupTotp = async (staffId: string) => {
  const staff = await prisma.platformStaff.findUnique({ where: { id: staffId } });
  if (!staff) {
    throw new Error("Staff account not found");
  }
  if (staff.totpEnabled) {
    throw new Error("MFA is already enabled on this account");
  }

  const secret = generateTotpSecret();
  await prisma.platformStaff.update({ where: { id: staffId }, data: { totpSecret: secret } });

  const qrCode = await buildTotpQrCode(staff.email, secret, "My Church Platform Admin");
  return { secret, qrCode };
};

export const enableTotp = async (staffId: string, code: string) => {
  const staff = await prisma.platformStaff.findUnique({ where: { id: staffId } });
  if (!staff || !staff.totpSecret) {
    throw new Error("Run TOTP setup first");
  }

  const valid = await verifyTotpCode(code, staff.totpSecret);
  if (!valid) {
    throw new Error("Invalid code");
  }

  const updated = await prisma.platformStaff.update({
    where: { id: staffId },
    data: { totpEnabled: true },
  });

  const token = generatePlatformToken({ staffId: updated.id, email: updated.email, role: updated.role });
  return { token, staff: { id: updated.id, email: updated.email, name: updated.name, role: updated.role } };
};

export const verifyTotpLogin = async (staffId: string, code: string) => {
  const staff = await prisma.platformStaff.findUnique({ where: { id: staffId } });
  if (!staff || !staff.totpEnabled || !staff.totpSecret) {
    throw new Error("MFA is not set up on this account");
  }

  const valid = await verifyTotpCode(code, staff.totpSecret);
  if (!valid) {
    throw new Error("Invalid code");
  }

  const token = generatePlatformToken({ staffId: staff.id, email: staff.email, role: staff.role });
  return { token, staff: { id: staff.id, email: staff.email, name: staff.name, role: staff.role } };
};

export const getCurrentPlatformStaff = async (staffId: string) => {
  const staff = await prisma.platformStaff.findUnique({
    where: { id: staffId },
    select: { id: true, email: true, name: true, role: true, totpEnabled: true, createdAt: true },
  });
  if (!staff) {
    throw new Error("Staff account not found");
  }
  return staff;
};

export const createPlatformStaff = async (data: { email: string; password: string; name: string; role: "OWNER" | "SUPPORT" }) => {
  const existing = await prisma.platformStaff.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new Error("An account with this email already exists");
  }
  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
  return prisma.platformStaff.create({
    data: { ...data, password: hashedPassword },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
};
