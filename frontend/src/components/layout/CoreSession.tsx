"use client";

import { useEffect, useState } from "react";

const ATTEMPT_KEY = "activity-planner:sso-attempt";
const SIGNED_IN_KEY = "activity-planner:was-signed-in";

/** Only session metadata is exposed to the browser; never the Core Hub token. */
export function CoreSession({ signedIn, available }: { signedIn: boolean; available: boolean }) {
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    let dirty = false;
    let stopped = false;
    let checking = false;
    const changed = (event: Event) => {
      if ((event.target as HTMLElement)?.closest("form")) dirty = true;
    };
    const signingOut = (event: Event) => {
      const form = event.target;
      if (form instanceof HTMLFormElement && new URL(form.action).pathname === "/auth/logout") {
        stopped = true;
        sessionStorage.removeItem(SIGNED_IN_KEY);
        sessionStorage.removeItem(ATTEMPT_KEY);
      }
    };
    const renew = () => {
      const last = Number(sessionStorage.getItem(ATTEMPT_KEY) ?? 0);
      if (dirty || Date.now() - last < 30000) { setExpired(true); return; }
      sessionStorage.setItem(ATTEMPT_KEY, String(Date.now()));
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- SSO requires full browser navigation, not the Next router.
      window.location.assign(`/auth/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    };
    if (signedIn) sessionStorage.setItem(SIGNED_IN_KEY, "true");
    else if (available && sessionStorage.getItem(SIGNED_IN_KEY)) renew();
    const check = async () => {
      if (!signedIn || checking || document.hidden) return;
      checking = true;
      try {
        const response = await fetch("/api/v1/me", { cache: "no-store", signal: AbortSignal.timeout(10000) });
        if (!stopped && response.status === 401) renew();
      } catch { /* Connectivity failures are not authentication failures. */ }
      finally { checking = false; }
    };
    document.addEventListener("input", changed);
    document.addEventListener("change", changed);
    document.addEventListener("submit", signingOut, true);
    const timer = window.setInterval(check, 30000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("input", changed);
      document.removeEventListener("change", changed);
      document.removeEventListener("submit", signingOut, true);
    };
  }, [signedIn, available]);

  if (!expired) return null;
  return <p role="status" className="bg-primary-container/10 text-primary text-sm leading-relaxed px-6 py-3 text-center">
    การเข้าสู่ระบบหมดเวลา กรุณาเก็บข้อความที่กรอกไว้ก่อนเข้าสู่ระบบอีกครั้ง{" "}
    <a className="underline" href="/auth/login" onClick={(event) => {
      event.preventDefault();
      if (!window.confirm("การเข้าสู่ระบบอีกครั้งจะเปิดหน้าใหม่ ข้อมูลในฟอร์มที่ยังไม่บันทึกอาจหาย ต้องการดำเนินการต่อหรือไม่?")) return;
      sessionStorage.setItem(ATTEMPT_KEY, String(Date.now()));
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Core SSO redirects across origins.
      window.location.assign(`/auth/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    }}>เข้าสู่ระบบอีกครั้ง</a>
  </p>;
}
