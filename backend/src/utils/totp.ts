import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";

const ISSUER = "My Church Platform Admin";

export const generateTotpSecret = (): string => generateSecret();

export const buildTotpQrCode = async (email: string, secret: string): Promise<string> => {
  const otpauthUrl = generateURI({ issuer: ISSUER, label: email, secret });
  return QRCode.toDataURL(otpauthUrl);
};

export const verifyTotpCode = async (token: string, secret: string): Promise<boolean> => {
  const result = await verify({ secret, token });
  return result.valid;
};
