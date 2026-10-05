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
    <section className="flex min-w-0 flex-col gap-8 text-body-md leading-relaxed [&_h1]:font-display [&_h1]:text-headline-md md:[&_h1]:text-headline-lg [&_h2]:font-display [&_h2]:text-headline-md [&_h3]:font-display [&_h3]:text-body-lg [&_h3]:font-semibold">
      <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest text-center p-8 [&_h3]:text-headline-md [&_h3]:mt-3 [&_h3]:mb-2 [&_p]:text-body-md [&_p]:text-on-surface-variant [&_p]:mb-6">
        <p className="text-label-md text-primary-container">กิจกรรมนักศึกษา · CSMJU2030</p>
        <h1 className="text-2xl font-bold text-primary">ร่วมกิจกรรม สร้างประสบการณ์ พัฒนาไปด้วยกัน</h1>
        <p>เข้าสู่ระบบด้วยบัญชีมหาวิทยาลัยเพื่อค้นหากิจกรรม ลงทะเบียนเข้าร่วม<br />สมัครทีมงาน และติดตามกิจกรรมของคุณ</p>
        <a className="btn-gradient inline-flex items-center justify-center min-h-11 rounded-lg px-4 py-2.5 text-label-md text-white shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-50" href={`/auth/login?next=${encodeURIComponent(pathname)}`} onClick={(event) => {
          event.preventDefault();
          sessionStorage.setItem("activity-planner:sso-attempt", String(Date.now()));
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Core SSO requires top-level navigation.
          window.location.assign(`/auth/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        }}>
          เข้าสู่ระบบด้วยบัญชี CSMJU2030
        </a>
      </div>
    </section>
  );
}
