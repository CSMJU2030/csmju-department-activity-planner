"use client";

import { useActionState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";

export function ActionForm({ action, children, label, variant = "primary", disabled = false }: {
  action: (data: FormData) => Promise<{ success: boolean; error?: string }>;
  children?: ReactNode;
  label: string;
  variant?: "primary" | "outline";
  disabled?: boolean;
}) {
  const [message, submit, pending] = useActionState(async (_previous: string, data: FormData) => {
    try {
      const result = await action(data);
      return result.success ? "บันทึกเรียบร้อยแล้ว" : result.error ?? "ไม่สามารถทำรายการได้";
    } catch {
      return "ทำรายการไม่สำเร็จ กรุณาลองอีกครั้ง";
    }
  }, "");

  return (
    <form action={submit} className="space-y-3 text-sm leading-[1.6] text-neutral">
      <fieldset disabled={pending || disabled} className="space-y-3">
        {children}
        <Button type="submit" variant={variant} disabled={pending || disabled}>
          {pending ? "กำลังดำเนินการ…" : label}
        </Button>
      </fieldset>
      <p role="status" aria-live="polite">{message}</p>
    </form>
  );
}
