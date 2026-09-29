import { notFound } from "next/navigation";
import { getCapabilities, getMe, type ApiResult, type Me } from "./api";

export type Session = { me: Me; canCreate: boolean };

/** Core Hub SSO entry point — the subsystem has no sign-in form of its own (SEC-05). */
export const ssoUrl = `${process.env.CORE_HUB_WEB_URL ?? "http://127.0.0.1:3100"}/api/sso/${encodeURIComponent(
  process.env.SUBSYSTEM_ID ?? "csmju-department-activity-planner",
)}`;

/**
 * The signed-in user, or null when there is no valid Core Hub session (401).
 * Any other failure (backend down, forbidden role) is thrown so error.tsx shows it.
 */
export async function getSession(): Promise<Session | null> {
  const me = await getMe();
  if (!me.ok) {
    if (me.status === 401) return null;
    throw new Error(me.message);
  }
  const capabilities = await getCapabilities();
  return { me: me.data, canCreate: capabilities.ok && capabilities.data.canCreateActivity };
}

/** Unwrap an API result for a page: an unknown id becomes the not-found page, other failures throw. */
export function unwrap<T>(result: ApiResult<T>): T {
  if (result.ok) return result.data;
  // 404 = no such activity; 400 = the id in the URL is not a UUID at all.
  if (result.status === 404 || result.status === 400) notFound();
  throw new Error(result.message);
}
