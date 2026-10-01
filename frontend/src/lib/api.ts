import { cookies } from "next/headers";
import type { ActivityItem, ActivityStatus, ApplicationStatus } from "@/types/activity";

/**
 * Server-only client for this subsystem's own backend. The browser never
 * calls the backend with a token of its own: pages and server actions
 * forward the HttpOnly SSO cookie, and the backend verifies it against the
 * Core Hub JWKS on every request.
 */
const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:4202";

/** Standard cookie name (auth-contract.md §5.1). */
export const SSO_COOKIE = `${(process.env.SUBSYSTEM_ID ?? "csmju-department-activity-planner").replace(/-/g, "_")}_access_token`;


// TODO(API-01): generate these from backend/openapi.json once the backend
// exports it (tech-stack.md §3).
export type SubsystemRole = "STUDENT" | "ALUMNI" | "STAFF" | "ADMIN";

export type Me = { id: string; email: string; coreRole: string; subsystemRole: SubsystemRole; session: { expiresAt: string } };

export type ActivityRole = {
  id: string;
  activityId: string;
  roleName: string;
  description: string;
  maxMembers: number;
  currentMembers: number;
};

export type TeamApplication = {
  id: string;
  activityId: string;
  roleId: string;
  coreUserId: string;
  userName: string;
  status: ApplicationStatus;
  createdAt: string;
};

export type Participation = {
  myApplication: TeamApplication | null;
  isRegistered: boolean;
  hasEvaluated: boolean;
};

export type EvaluationItem = {
  id: string;
  activityId: string;
  coreUserId: string;
  rating: number;
  liked: string;
  improvement: string;
  createdAt: string;
};

export type MyActivities = {
  created: ActivityItem[];
  registrations: Array<{
    id: string;
    activityId: string;
    coreUserId: string;
    createdAt: string;
    activity: ActivityItem;
  }>;
  applications: Array<
    TeamApplication & {
      activity: { id: string; title: string; status: ActivityStatus } | null;
      role: { id: string; roleName: string } | null;
    }
  >;
};

export type OrganizedActivity = {
  id: string;
  title: string;
  category: string;
  startAt: string;
  endAt: string;
  location: string;
  maxParticipants: number;
  status: ActivityStatus;
  registrations: Array<{ id: string; coreUserId: string; createdAt: string }>;
};

type Envelope<T> =
  | { success: true; data: T; meta?: { totalPages?: number } }
  | { success: false; error: { code: string; message: string } };

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; message: string };

type CallResult<T> = ApiResult<T> & { totalPages?: number };

export async function call<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<CallResult<T>> {
  const token = (await cookies()).get(SSO_COOKIE)?.value;
  if (!token) return { ok: false, status: 401, message: "ยังไม่ได้เข้าสู่ระบบ" };

  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}${path}`, {
      method: init.method ?? "GET",
      headers: {
        ...(token ? { Cookie: `${SSO_COOKIE}=${encodeURIComponent(token)}` } : {}),
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return { ok: false, status: 503, message: "เชื่อมต่อ backend ของระบบย่อยไม่ได้" };
  }

  const body = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (res.ok && body?.success) {
    return { ok: true, data: body.data, totalPages: body.meta?.totalPages };
  }
  return {
    ok: false,
    status: res.status,
    message: body && !body.success ? body.error.message : `HTTP ${res.status}`,
  };
}

const enc = encodeURIComponent;

export const getMe = () => call<Me>("/api/v1/me");
export const getCapabilities = () =>
  call<{ canCreateActivity: boolean }>("/api/v1/me/activity-capabilities");

/** Every activity, newest first (the API pages at 100). */
export async function listAllActivities(): Promise<ApiResult<ActivityItem[]>> {
  const all: ActivityItem[] = [];
  for (let page = 1; ; page++) {
    const result = await call<ActivityItem[]>(`/api/v1/activities?page=${page}&limit=100`);
    if (!result.ok) return result;
    all.push(...result.data);
    if (page >= (result.totalPages ?? 1)) return { ok: true, data: all };
  }
}

export const getActivity = (id: string) => call<ActivityItem>(`/api/v1/activities/${enc(id)}`);
export const listRoles = (id: string) => call<ActivityRole[]>(`/api/v1/activities/${enc(id)}/roles`);
export const listApplications = (id: string) =>
  call<TeamApplication[]>(`/api/v1/activities/${enc(id)}/applications`);
export const listEvaluations = (id: string) =>
  call<EvaluationItem[]>(`/api/v1/activities/${enc(id)}/evaluations`);
export const getParticipation = (id: string) =>
  call<Participation>(`/api/v1/activities/${enc(id)}/participation`);
export const getMyActivities = () => call<MyActivities>("/api/v1/me/activities");
export const getOrganizedActivities = () =>
  call<OrganizedActivity[]>("/api/v1/me/organized-activities");
