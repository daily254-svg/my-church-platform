import fs from "fs";
import path from "path";
import prisma from "../../config/db";
import { sendEmail } from "../../services/email.service";

// Deliberately NOT under uploads/ — that directory is served statically and
// publicly at /uploads. A church's full data export (member emails/phones,
// giving amounts) must never be reachable by a guessable public URL.
const EXPORTS_DIR = path.join(__dirname, "../../../exports");

const gatherChurchData = async (churchId: string) => {
  const church = await prisma.church.findUnique({ where: { id: churchId } });
  if (!church) throw new Error("Church not found");

  const [users, ministryGroups, events, sermons, announcements, givings, prayers, feedPosts] = await Promise.all([
    prisma.user.findMany({
      where: { churchId },
      select: {
        id: true, email: true, name: true, phone: true, gender: true, ministry: true,
        role: true, status: true, createdAt: true,
        // password/totpSecret intentionally excluded
      },
    }),
    prisma.ministryGroup.findMany({ where: { churchId } }),
    prisma.event.findMany({ where: { churchId }, include: { registrations: true } }),
    prisma.sermon.findMany({ where: { churchId } }),
    prisma.announcement.findMany({ where: { churchId } }),
    prisma.giving.findMany({ where: { churchId } }),
    prisma.prayer.findMany({ where: { churchId } }),
    prisma.feedPost.findMany({ where: { churchId }, include: { comments: true } }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    church,
    users,
    ministryGroups,
    events,
    sermons,
    announcements,
    givings,
    prayers,
    feedPosts,
  };
};

export const exportChurchData = async (churchId: string): Promise<{ filePath: string; data: unknown }> => {
  const data = await gatherChurchData(churchId);

  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
  const fileName = `${churchId}-${Date.now()}.json`;
  const filePath = path.join(EXPORTS_DIR, fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");

  return { filePath, data };
};

export const emailChurchExport = async (churchId: string): Promise<void> => {
  const { filePath, data } = await exportChurchData(churchId);
  const church = (data as { church: { name: string } }).church;

  const admins = await prisma.user.findMany({
    where: { churchId, role: "ADMIN", status: "ACTIVE" },
    select: { email: true, name: true },
  });

  if (admins.length === 0) {
    console.warn(`[export] No active admin to email export for church ${churchId} — export saved at ${filePath}`);
    return;
  }

  const fileBuffer = fs.readFileSync(filePath);

  await sendEmail({
    to: admins.map((a) => a.email),
    subject: `Your data export from ${church.name}`,
    htmlContent: `
      <p>Hi,</p>
      <p>As requested, here's a full export of ${church.name}'s data on My Church Platform —
      members, ministries, events, sermons, announcements, giving records, prayer requests, and feed posts.</p>
      <p>If this church's account is cancelled, this data will be permanently deleted 14 days after
      cancellation. Keep this file if you need a record.</p>
    `,
    attachments: [{ name: path.basename(filePath), content: fileBuffer.toString("base64") }],
  });
};
