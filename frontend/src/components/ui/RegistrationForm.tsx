"use client";

import { useActionState } from "react";
import { cancelRegistrationAction, registerActivityAction } from "@/app/actions/activity";
import { Button } from "@/components/ui/Button";

export function RegistrationForm({ activityId, mode, disabled = false }: {
  activityId: string;
  mode: "register" | "cancel";
  disabled?: boolean;
}) {
  const [message, action, pending] = useActionState(async () => {
    try {
      const result = await (mode === "cancel"
        ? cancelRegistrationAction(activityId)
        : registerActivityAction(activityId));
      return result.success
        ? mode === "cancel" ? "ยกเลิกการลงทะเบียนแล้ว" : "ลงทะเบียนสำเร็จแล้ว"
        : result.error ?? "ไม่สามารถทำรายการได้";
    } catch {
      return "ทำรายการไม่สำเร็จ กรุณาลองอีกครั้ง";
    }
  }, "");

  return (
    <form action={action} className="space-y-2 text-sm leading-[1.6]">
      <Button type="submit" variant={mode === "cancel" ? "outline" : "primary"}
        disabled={disabled || pending}>
        {pending ? "กำลังดำเนินการ…" : mode === "cancel" ? "ยกเลิกการลงทะเบียน" : "ลงทะเบียนเข้าร่วมกิจกรรม"}
      </Button>
      <p role="status" aria-live="polite" className="text-neutral">{message}</p>
    </form>
  );
}
