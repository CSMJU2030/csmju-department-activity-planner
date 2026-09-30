"use server";

import { revalidatePath } from "next/cache";
import { call } from "@/lib/api";

/**
 * Form actions. Each one validates the raw form input, then forwards the
 * request to the backend with the caller's SSO cookie. The backend checks the
 * permission and every business rule itself, so hiding a button on a page is
 * only a convenience.
 */

type ActivityStatus = "OPEN" | "FULL" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

const ALLOWED_CATEGORIES = new Set([
  "workshop",
  "seminar",
  "competition",
  "volunteer",
  "recreation",
  "academic",
  "other",
]);

const ALLOWED_STATUSES = new Set<string>(["OPEN", "FULL", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);

/** What every action reports back to the form that called it. */
type ActionResult = { success: boolean; error?: string; activityId?: string };

/** A failed backend call as the action result: business rules arrive already worded in Thai. */
function failed(result: { ok: false; status: number; message: string }, fallback: string): ActionResult {
  if (result.status === 401) return { success: false, error: "Unauthorized" };
  return { success: false, error: result.message || fallback };
}

function parseThaiLocalToUtc(dateTimeStr: unknown): Date | null {
  if (typeof dateTimeStr !== "string") return null;
  const s = dateTimeStr.trim();
  if (!s) return null;

  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  const hour = parseInt(match[4], 10);
  const minute = parseInt(match[5], 10);
  const second = match[6] ? parseInt(match[6], 10) : 0;

  if (month < 1 || month > 12) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) return null;

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > daysInMonth) return null;

  return new Date(Date.UTC(year, month - 1, day, hour - 7, minute, second));
}

function parseActivityForm(formData: FormData) {
  const titleRaw = formData.get("title");
  const descRaw = formData.get("description");
  const catRaw = formData.get("category");
  const locRaw = formData.get("location");
  const maxPartRaw = formData.get("maxParticipants");
  const startAtRaw = formData.get("startAt");
  const endAtRaw = formData.get("endAt");

  if (
    typeof titleRaw !== "string" ||
    (descRaw !== null && typeof descRaw !== "string") ||
    typeof catRaw !== "string" ||
    (locRaw !== null && typeof locRaw !== "string") ||
    typeof maxPartRaw !== "string"
  ) {
    return null;
  }

  const title = titleRaw.trim();
  const description = (descRaw ?? "").trim();
  const category = catRaw.trim().toLowerCase();
  const location = (locRaw ?? "").trim();

  if (title.length === 0 || title.length > 150) return null;
  if (description.length > 5000) return null;
  if (location.length > 200) return null;
  if (!ALLOWED_CATEGORIES.has(category)) return null;

  const maxPartStr = maxPartRaw.trim();
  if (!/^\d+$/.test(maxPartStr)) return null;
  const maxParticipants = Number(maxPartStr);
  if (
    !Number.isSafeInteger(maxParticipants) ||
    maxParticipants <= 0 ||
    maxParticipants > 2147483647
  ) {
    return null;
  }

  if (startAtRaw !== null && typeof startAtRaw !== "string") return null;
  if (endAtRaw !== null && typeof endAtRaw !== "string") return null;

  const startAt = startAtRaw !== null ? parseThaiLocalToUtc(startAtRaw) : null;
  const endAt = endAtRaw !== null ? parseThaiLocalToUtc(endAtRaw) : null;

  if (startAtRaw !== null && !startAt) return null;
  if (endAtRaw !== null && !endAt) return null;
  if (startAt && endAt && endAt.getTime() <= startAt.getTime()) return null;

  return {
    title,
    description,
    category,
    location,
    maxParticipants,
    startAt,
    endAt,
  };
}

export async function createActivityAction(formData: FormData): Promise<ActionResult> {
  const parsed = parseActivityForm(formData);
  if (!parsed || !parsed.startAt || !parsed.endAt) {
    return { success: false, error: "Invalid form input" };
  }

  const result = await call<{ id: string }>("/api/v1/activities", {
    method: "POST",
    body: {
      title: parsed.title,
      description: parsed.description,
      category: parsed.category,
      location: parsed.location,
      maxParticipants: parsed.maxParticipants,
      startAt: parsed.startAt.toISOString(),
      endAt: parsed.endAt.toISOString(),
    },
  });
  if (!result.ok) return failed(result, "Failed to create");

  revalidatePath("/my-activities");
  return { success: true, activityId: result.data.id };
}

export async function updateActivityAction(formData: FormData): Promise<ActionResult> {
  const activityIdRaw = formData.get("activityId");
  if (typeof activityIdRaw !== "string" || !activityIdRaw.trim()) {
    return { success: false, error: "Missing activity ID" };
  }

  const parsed = parseActivityForm(formData);
  if (!parsed) {
    return { success: false, error: "Invalid form input" };
  }

  const result = await call<{ id: string }>(`/api/v1/activities/${encodeURIComponent(activityIdRaw.trim())}`, {
    method: "PATCH",
    body: {
      title: parsed.title,
      description: parsed.description,
      category: parsed.category,
      location: parsed.location,
      maxParticipants: parsed.maxParticipants,
      // The edit form has no schedule fields; the backend keeps the stored times when they are absent.
      ...(parsed.startAt ? { startAt: parsed.startAt.toISOString() } : {}),
      ...(parsed.endAt ? { endAt: parsed.endAt.toISOString() } : {}),
    },
  });
  if (!result.ok) return failed(result, "Failed to update");

  revalidatePath(`/activities/${activityIdRaw}`);
  return { success: true, activityId: result.data.id };
}

export async function updateActivityStatusAction(activityId: string, status: unknown): Promise<ActionResult> {
  if (!activityId || typeof status !== "string" || !ALLOWED_STATUSES.has(status)) {
    return { success: false, error: "Invalid status" };
  }

  const result = await call(`/api/v1/activities/${encodeURIComponent(activityId)}/status`, {
    method: "PATCH",
    body: { status: status as ActivityStatus },
  });
  if (!result.ok) return failed(result, "Failed to update status");

  revalidatePath(`/activities/${activityId}`);
  return { success: true };
}

export async function registerActivityAction(activityId: string): Promise<ActionResult> {
  const result = await call(`/api/v1/activities/${encodeURIComponent(activityId)}/registrations`, {
    method: "POST",
  });
  if (!result.ok) return failed(result, "Registration failed");

  revalidatePath(`/activities/${activityId}`);
  return { success: true };
}

export async function cancelRegistrationAction(activityId: string): Promise<ActionResult> {
  const result = await call(`/api/v1/activities/${encodeURIComponent(activityId)}/registrations/me`, {
    method: "DELETE",
  });
  if (!result.ok) return failed(result, "Cancellation failed");

  revalidatePath(`/activities/${activityId}`);
  return { success: true };
}

export async function createActivityRoleAction(activityId: string, formData: FormData): Promise<ActionResult> {
  const roleNameRaw = formData.get("roleName");
  const roleDescRaw = formData.get("roleDescription");
  const maxMemRaw = formData.get("maxMembers");

  if (typeof roleNameRaw !== "string" || typeof maxMemRaw !== "string") {
    return { success: false, error: "Invalid input" };
  }

  const roleName = roleNameRaw.trim();
  const description = typeof roleDescRaw === "string" ? roleDescRaw.trim() : "";

  if (roleName.length === 0 || roleName.length > 100) return { success: false, error: "Invalid roleName" };
  if (description.length > 500) return { success: false, error: "Invalid description" };

  if (!/^\d+$/.test(maxMemRaw.trim())) return { success: false, error: "Invalid maxMembers" };
  const maxMembers = Number(maxMemRaw.trim());
  if (!Number.isInteger(maxMembers) || maxMembers <= 0 || maxMembers > 100) {
    return { success: false, error: "Invalid maxMembers" };
  }

  const result = await call(`/api/v1/activities/${encodeURIComponent(activityId)}/roles`, {
    method: "POST",
    body: { roleName, description, maxMembers },
  });
  if (!result.ok) return failed(result, "Failed to create role");

  revalidatePath(`/activities/${activityId}`);
  return { success: true };
}

export async function applyTeamRoleAction(activityId: string, roleId: string): Promise<ActionResult> {
  const result = await call(
    `/api/v1/activities/${encodeURIComponent(activityId)}/roles/${encodeURIComponent(roleId)}/applications`,
    { method: "POST" },
  );
  if (!result.ok) return failed(result, "Application failed");

  revalidatePath(`/activities/${activityId}`);
  return { success: true };
}

export async function respondTeamApplicationAction(
  activityId: string,
  applicationId: string,
  status: string
): Promise<ActionResult> {
  if (!["ACCEPTED", "REJECTED"].includes(status)) {
    return { success: false, error: "Invalid status response" };
  }

  const result = await call(
    `/api/v1/activities/${encodeURIComponent(activityId)}/applications/${encodeURIComponent(applicationId)}`,
    { method: "PATCH", body: { status } },
  );
  if (!result.ok) return failed(result, "Response failed");

  revalidatePath(`/activities/${activityId}`);
  return { success: true };
}

export async function submitEvaluationAction(formData: FormData): Promise<ActionResult> {
  const activityIdRaw = formData.get("activityId");
  const ratingRaw = formData.get("rating");
  const likedRaw = formData.get("liked");
  const improvementRaw = formData.get("improvement");

  if (
    typeof activityIdRaw !== "string" ||
    typeof ratingRaw !== "string" ||
    typeof likedRaw !== "string" ||
    typeof improvementRaw !== "string"
  ) {
    return { success: false, error: "Invalid types" };
  }

  if (!/^[1-5]$/.test(ratingRaw.trim())) {
    return { success: false, error: "Rating must be 1 to 5" };
  }
  const rating = parseInt(ratingRaw.trim(), 10);

  const liked = likedRaw.trim();
  const improvement = improvementRaw.trim();

  if (liked.length === 0 || liked.length > 2000) return { success: false, error: "Invalid liked text" };
  if (improvement.length === 0 || improvement.length > 2000) return { success: false, error: "Invalid improvement text" };

  const result = await call(`/api/v1/activities/${encodeURIComponent(activityIdRaw.trim())}/evaluations`, {
    method: "POST",
    body: { rating, liked, improvement },
  });
  if (!result.ok) return failed(result, "Failed to evaluate");

  revalidatePath(`/activities/${activityIdRaw}`);
  return { success: true };
}
