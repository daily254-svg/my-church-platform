import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";

const DEFAULT_ISSUER = "My Church Platform";

export const generateTotpSecret = (): string => generateSecret();

export const buildTotpQrCode = async (email: string, secret: string, issuer: string = DEFAULT_ISSUER): Promise<string> => {
  const otpauthUrl = generateURI({ issuer, label: email, secret });
  return QRCode.toDataURL(otpauthUrl);
};

export const verifyTotpCode = async (token: string, secret: string): Promise<boolean> => {
  const result = await verify({ secret, token });
  return result.valid;
};
