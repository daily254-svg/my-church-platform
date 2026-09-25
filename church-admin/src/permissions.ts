import type { StaffRole } from "./api";

export type TabKey =
  | "members"
  | "ministries"
  | "events"
  | "sermons"
  | "announcements"
  | "giving"
  | "prayers"
  | "invites"
  | "branches";

// Mirrors media-panel's ROLE_SCREENS pattern — one place mapping each role
// to the tabs it can use, built directly from the backend's authorize()
// rules (see each module's *.routes.ts), not guessed independently of them.
//
// MEDIA has no write capability anywhere in this backend today (grep
// "authorize(\[" across src/modules — MEDIA never appears). Their real
// home is live-service/broadcast tooling, which doesn't exist as a screen
// here yet, so they get read-only access to the one screen with no role
// restriction at all (Prayers) rather than a panel full of dead buttons.
export const ROLE_SCREENS: Record<StaffRole, TabKey[]> = {
  ADMIN: ["members", "ministries", "events", "sermons", "announcements", "giving", "prayers", "invites", "branches"],
  PASTOR: ["members", "ministries", "sermons", "announcements", "giving", "prayers"],
  SECRETARY: ["members", "events", "announcements", "giving", "prayers"],
  MEDIA: ["prayers"],
};
