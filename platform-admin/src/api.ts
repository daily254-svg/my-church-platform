const API_BASE_KEY = "platform_admin_api_base";
const TOKEN_KEY = "platform_admin_token";

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

export interface LoginResult {
  preMfaToken: string;
  mfaSetupRequired: boolean;
}

export const login = (email: string, password: string) =>
  request<LoginResult>("/platform-admin/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });

export interface TotpSetupResult {
  secret: string;
  qrCode: string;
}

export const totpSetup = (preMfaToken: string) =>
  request<TotpSetupResult>("/platform-admin/auth/totp/setup", { method: "POST" }, preMfaToken);

export interface Staff {
  id: string;
  email: string;
  name: string;
  role: "OWNER" | "SUPPORT";
}

export interface AuthResult {
  token: string;
  staff: Staff;
}

export const totpEnable = (preMfaToken: string, code: string) =>
  request<AuthResult>("/platform-admin/auth/totp/enable", { method: "POST", body: JSON.stringify({ code }) }, preMfaToken);

export const totpVerify = (preMfaToken: string, code: string) =>
  request<AuthResult>("/platform-admin/auth/totp/verify", { method: "POST", body: JSON.stringify({ code }) }, preMfaToken);

export const me = (token: string) => request<Staff & { totpEnabled: boolean; createdAt: string }>("/platform-admin/auth/me", {}, token);

export interface Plan {
  id: string;
  name: string;
  slug: string;
  maxBranches: number;
  priceKES: number | null;
  priceUSD: number | null;
  isActive: boolean;
  createdAt: string;
}

export const listPlans = (token: string) => request<Plan[]>("/platform-admin/plans", {}, token);

export const createPlan = (
  token: string,
  data: { name: string; slug: string; maxBranches: number; priceKES?: number; priceUSD?: number },
) => request<Plan>("/platform-admin/plans", { method: "POST", body: JSON.stringify(data) }, token);

export const updatePlan = (
  token: string,
  id: string,
  data: Partial<{ name: string; maxBranches: number; priceKES: number; priceUSD: number; isActive: boolean }>,
) => request<Plan>(`/platform-admin/plans/${id}`, { method: "PATCH", body: JSON.stringify(data) }, token);

export interface Subscription {
  id: string;
  status: "TRIALING" | "ACTIVE" | "PAST_DUE" | "DISABLED" | "CANCELLED";
  trialEndsAt: string | null;
  plan: Plan;
}

export interface Church {
  id: string;
  name: string;
  slug: string;
  inviteCode: string;
  status: "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "CANCELLED";
  requireApproval: boolean;
  country: string | null;
  subscription: Subscription | null;
  branches: Church[];
  createdAt: string;
}

export const listChurches = (token: string) => request<Church[]>("/platform-admin/churches", {}, token);

export const createChurch = (token: string, data: { name: string; country?: string; requireApproval?: boolean }) =>
  request<Church>("/platform-admin/churches", { method: "POST", body: JSON.stringify(data) }, token);

export const approveChurch = (token: string, id: string) =>
  request<Church>(`/platform-admin/churches/${id}/approve`, { method: "POST" }, token);

export const suspendChurch = (token: string, id: string) =>
  request<Church>(`/platform-admin/churches/${id}/suspend`, { method: "POST" }, token);

export const reactivateChurch = (token: string, id: string) =>
  request<Church>(`/platform-admin/churches/${id}/reactivate`, { method: "POST" }, token);

export const cancelChurch = (token: string, id: string) =>
  request<Church>(`/platform-admin/churches/${id}/cancel`, { method: "POST" }, token);

export const changeSubscriptionPlan = (token: string, churchId: string, planId: string) =>
  request<Subscription>(`/platform-admin/churches/${churchId}/subscription/plan`, {
    method: "PATCH",
    body: JSON.stringify({ planId }),
  }, token);

export const changeSubscriptionStatus = (token: string, churchId: string, status: Subscription["status"]) =>
  request<Subscription>(`/platform-admin/churches/${churchId}/subscription/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  }, token);
