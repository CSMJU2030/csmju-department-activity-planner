"use client";

import { usePathname } from "next/navigation";

/**
 * Shown instead of a page when there is no Core Hub session. The subsystem has
 * no sign-in form of its own (SEC-05): the button sends the browser to Core
 * Hub's SSO launcher, which signs the user in if needed and redirects back to
 * /auth/callback here with a Core Hub token.
 */
export function SignedOut() {
  const pathname = usePathname();
  return (
    <main className="dashboard-shell">
      <div className="empty-panel">
        <p className="eyebrow">กิจกรรมนักศึกษา · CSMJU2030</p>
        <h1 className="text-2xl font-bold text-primary">ร่วมกิจกรรม สร้างประสบการณ์ พัฒนาไปด้วยกัน</h1>
        <p>เข้าสู่ระบบด้วยบัญชีมหาวิทยาลัยเพื่อค้นหากิจกรรม ลงทะเบียนเข้าร่วม<br />สมัครทีมงาน และติดตามกิจกรรมของคุณ</p>
        <a className="primary-link" href={`/auth/login?next=${encodeURIComponent(pathname)}`} onClick={(event) => {
          event.preventDefault();
          sessionStorage.setItem("activity-planner:sso-attempt", String(Date.now()));
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Core SSO requires top-level navigation.
          window.location.assign(`/auth/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        }}>
          เข้าสู่ระบบด้วยบัญชี CSMJU2030
        </a>
      </div>
    </main>
  );
}
