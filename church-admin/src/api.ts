const API_BASE_KEY = "church_admin_api_base";
const TOKEN_KEY = "church_admin_token";

export const getApiBase = (): string => localStorage.getItem(API_BASE_KEY) ?? "";
export const setApiBase = (url: string): void => localStorage.setItem(API_BASE_KEY, url.replace(/\/$/, ""));

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

class ApiError extends Error {}

async function request<T>(path: string, options: RequestInit = {}, bearer?: string): Promise<T> {
  const base = getApiBase();
  if (!base) throw new ApiError("API base URL is not set");

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  const res = await fetch(`${base}${path}`, { ...options, headers: { ...headers, ...(options.headers as Record<string, string> | undefined) } });
  const body = await res.json().catch(() => ({}));

  if (!res.ok || body.success === false) {
    const message = body.message || body.errors?.[0]?.message || `Request failed (${res.status})`;
    throw new ApiError(message);
  }
  return body.data as T;
}

// ── Auth ──────────────────────────────────────────────────────────

export type StaffRole = "ADMIN" | "PASTOR" | "SECRETARY" | "MEDIA";
export type Role = StaffRole | "MEMBER";

export interface LoginResult {
  // Staff roles get an MFA step
  preMfaToken?: string;
  mfaSetupRequired?: boolean;
  // MEMBER accounts (shouldn't normally use this panel) log in directly
  token?: string;
  user?: { id: string; role: Role };
}

export const login = (email: string, password: string) =>
  request<LoginResult>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });

export interface TotpSetupResult {
  secret: string;
  qrCode: string;
}

export const totpSetup = (preMfaToken: string) =>
  request<TotpSetupResult>("/auth/totp/setup", { method: "POST" }, preMfaToken);

export interface AuthedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  churchId: string;
}

export interface AuthResult {
  token: string;
  user: AuthedUser;
}

export const totpEnable = (preMfaToken: string, code: string) =>
  request<AuthResult>("/auth/totp/enable", { method: "POST", body: JSON.stringify({ code }) }, preMfaToken);

export const totpVerify = (preMfaToken: string, code: string) =>
  request<AuthResult>("/auth/totp/verify", { method: "POST", body: JSON.stringify({ code }) }, preMfaToken);

export const me = (token: string) => request<AuthedUser>("/auth/me", {}, token);

export const acceptInvite = (token: string, password: string) =>
  request<{ id: string; email: string; role: Role }>("/auth/accept-invite", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });

// ── Members ───────────────────────────────────────────────────────

export interface PendingMember {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  ministry: string | null;
  role: Role;
  requestedRole: Role | null;
  status: string;
  createdAt: string;
}

export const listPendingMembers = (token: string) => request<PendingMember[]>("/members/pending", {}, token);
export const approveMember = (token: string, userId: string) =>
  request<PendingMember>(`/members/${userId}/approve`, { method: "POST" }, token);
export const rejectMember = (token: string, userId: string) =>
  request<PendingMember>(`/members/${userId}/reject`, { method: "POST" }, token);

export const listActiveMembers = (token: string) => request<PendingMember[]>("/members", {}, token);
export const markMemberLeft = (token: string, userId: string) =>
  request<PendingMember>(`/members/${userId}/mark-left`, { method: "POST" }, token);

export interface MemberDetail extends PendingMember {
  gender: string | null;
  ministries: { joinedAt: string; group: { id: string; name: string; accent: string } }[];
  givings: { id: string; category: string; amount: number; service: string; status: string; createdAt: string }[];
  eventRegistrations: {
    id: string;
    createdAt: string;
    event: { id: string; title: string; date: string; time: string };
  }[];
}

export const getMemberDetail = (token: string, userId: string) =>
  request<MemberDetail>(`/members/${userId}`, {}, token);

// ── Staff invites ─────────────────────────────────────────────────

export interface StaffInvite {
  id: string;
  email: string;
  name: string | null;
  role: StaffRole;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export const listInvites = (token: string) => request<StaffInvite[]>("/members/invites", {}, token);
export const inviteStaff = (token: string, data: { email: string; name?: string; role: StaffRole }) =>
  request<StaffInvite>("/members/invites", { method: "POST", body: JSON.stringify(data) }, token);
export const revokeInvite = (token: string, inviteId: string) =>
  request<StaffInvite>(`/members/invites/${inviteId}/revoke`, { method: "POST" }, token);

// ── Branches ──────────────────────────────────────────────────────

export interface Branch {
  id: string;
  name: string;
  slug: string;
  inviteCode: string;
  status: string;
  createdAt: string;
}

export const listBranches = (token: string) => request<Branch[]>("/churches/branches", {}, token);
export const createBranch = (
  token: string,
  data: { name: string; country?: string; adminName: string; adminEmail: string; adminPassword: string },
) => request<{ branch: Branch }>("/churches/branches", { method: "POST", body: JSON.stringify(data) }, token);

// ── Ministries ────────────────────────────────────────────────────

export interface MinistryGroup {
  id: string;
  name: string;
  description: string | null;
  accent: string;
  imageUrl: string | null;
  createdAt: string;
  _count: { members: number; messages: number };
}

export const listMinistries = (token: string) => request<MinistryGroup[]>("/ministry", {}, token);
export const createMinistry = (token: string, data: { name: string; description?: string; accent?: string }) =>
  request<MinistryGroup>("/ministry", { method: "POST", body: JSON.stringify(data) }, token);
export const updateMinistry = (token: string, groupId: string, data: { name?: string; description?: string; accent?: string }) =>
  request<MinistryGroup>(`/ministry/${groupId}`, { method: "PATCH", body: JSON.stringify(data) }, token);
export const deleteMinistry = (token: string, groupId: string) =>
  request<{ message: string }>(`/ministry/${groupId}`, { method: "DELETE" }, token);

// ── Events ────────────────────────────────────────────────────────

export interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
  accent: string;
  acceptRegistration: boolean;
  registrations: { id: string }[];
  createdAt: string;
}

export const listEvents = (token: string) => request<EventItem[]>("/events", {}, token);
export const createEvent = (
  token: string,
  data: { title: string; date: string; time: string; type: string; acceptRegistration?: boolean },
) => request<EventItem>("/events", { method: "POST", body: JSON.stringify(data) }, token);
export const deleteEvent = (token: string, id: string) =>
  request<EventItem>(`/events/${id}`, { method: "DELETE" }, token);

// ── Sermons ───────────────────────────────────────────────────────

export type SermonStatus = "DRAFT" | "READY" | "DELIVERED";

export interface Sermon {
  id: string;
  title: string;
  description: string | null;
  status: SermonStatus;
  createdAt: string;
}

export const listSermons = (token: string) => request<Sermon[]>("/sermons", {}, token);
export const createSermon = (token: string, data: { title: string; description?: string }) =>
  request<Sermon>("/sermons", { method: "POST", body: JSON.stringify(data) }, token);
export const updateSermonStatus = (token: string, id: string, status: SermonStatus) =>
  request<Sermon>(`/sermons/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }, token);
export const deleteSermon = (token: string, id: string) =>
  request<{ message: string }>(`/sermons/${id}`, { method: "DELETE" }, token);

// ── Announcements ─────────────────────────────────────────────────

export type AnnouncementCategory = "GENERAL" | "EVENT" | "EMERGENCY" | "PRAYER" | "OFFERING";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  isLive: boolean;
  sentAt: string | null;
  createdAt: string;
}

export const listAnnouncements = (token: string) => request<Announcement[]>("/announcements", {}, token);
export const createAnnouncement = (token: string, data: { title: string; body: string; category?: AnnouncementCategory }) =>
  request<Announcement>("/announcements", { method: "POST", body: JSON.stringify(data) }, token);
export const sendAnnouncement = (token: string, id: string) =>
  request<Announcement>(`/announcements/${id}/send`, { method: "PATCH" }, token);
export const deleteAnnouncement = (token: string, id: string) =>
  request<{ message: string }>(`/announcements/${id}`, { method: "DELETE" }, token);

// ── Giving ────────────────────────────────────────────────────────

export interface GivingRecord {
  id: string;
  category: string;
  amount: number;
  reference: string | null;
  service: string;
  status: string;
  createdAt: string;
  user: { name: string | null; email: string };
}

export interface GivingSummary {
  total: number;
  titheTotal: number;
  offeringTotal: number;
  count: number;
  titheCount: number;
  offeringCount: number;
}

export const getGivingSummary = (token: string) => request<GivingSummary>("/giving/summary", {}, token);
export const listGivings = (token: string) => request<GivingRecord[]>("/giving", {}, token);

// ── Prayers ───────────────────────────────────────────────────────

export interface Prayer {
  id: string;
  text: string;
  category: string;
  isAnonymous: boolean;
  prayerCount: number;
  createdAt: string;
  user: { name: string | null };
}

export const listPrayers = (token: string) => request<Prayer[]>("/prayers", {}, token);
export const deletePrayer = (token: string, id: string) =>
  request<Prayer>(`/prayers/${id}`, { method: "DELETE" }, token);
