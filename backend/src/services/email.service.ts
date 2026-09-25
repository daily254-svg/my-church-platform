import axios from "axios";
import { BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME } from "../config/env";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export interface EmailPayload {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
}

// No-ops with a warning if Brevo isn't configured yet, rather than throwing —
// invites/other flows that trigger email shouldn't hard-fail in dev before a
// key is added.
export const sendEmail = async (payload: EmailPayload): Promise<void> => {
  if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL) {
    console.warn(`[email] BREVO_API_KEY/BREVO_SENDER_EMAIL not set — skipping email to ${payload.to}`);
    return;
  }

  try {
    await axios.post(
      BREVO_ENDPOINT,
      {
        sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
        to: [{ email: payload.to, name: payload.toName ?? payload.to }],
        subject: payload.subject,
        htmlContent: payload.htmlContent,
      },
      {
        headers: {
          "api-key": BREVO_API_KEY,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );
  } catch (err) {
    const message = axios.isAxiosError(err) ? JSON.stringify(err.response?.data) : String(err);
    console.error(`[email] Failed to send to ${payload.to}:`, message);
  }
};
