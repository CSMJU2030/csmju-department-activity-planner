"use server";

import { revalidatePath } from "next/cache";
import { call } from "@/lib/api";

export async function grantHeadAction(data: FormData) {
  const id = data.get("coreUserId");
  if (typeof id !== "string" || !/^\S{1,64}$/.test(id.trim())) {
    return { success: false, error: "กรุณาระบุรหัสผู้ใช้ Core ที่ถูกต้อง ไม่ใช่อีเมล" };
  }
  const result = await call("/api/v1/admin/activity-heads", { method: "POST", body: { coreUserId: id.trim() } });
  if (!result.ok) return { success: false, error: result.status === 401 ? "กรุณาเข้าสู่ระบบอีกครั้ง" : result.message };
  revalidatePath("/admin/heads");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function revokeHeadAction(data: FormData) {
  const id = data.get("coreUserId");
  if (typeof id !== "string" || !/^\S{1,64}$/.test(id)) return { success: false, error: "รหัสผู้ใช้ไม่ถูกต้อง" };
  const result = await call(`/api/v1/admin/activity-heads/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!result.ok) return { success: false, error: result.status === 401 ? "กรุณาเข้าสู่ระบบอีกครั้ง" : result.message };
  revalidatePath("/admin/heads");
  revalidatePath("/", "layout");
  return { success: true };
}
