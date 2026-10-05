import { CsmjuAppShell, type NavItem } from "@/csmju";
import { CoreSession } from "@/components/layout/CoreSession";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "กิจกรรมนักศึกษา | CSMJU2030",
  description: "วางแผนกิจกรรม ร่วมทีม และพัฒนากิจกรรมนักศึกษาไปด้วยกัน",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The layout must render even when the backend is down or the user is signed out.
  const { session, available } = await getSession()
    .then((session) => ({ session, available: true }))
    .catch(() => ({ session: null, available: false }));
  const nav: NavItem[] = [
    { label: "สำรวจกิจกรรม", labelEn: "Activities", href: "/", icon: "event" },
    ...(session ? [{ label: "กิจกรรมของฉัน", labelEn: "My activities", href: "/my-activities", icon: "description" } as NavItem] : []),
    ...(session?.me.subsystemRole === "ADMIN" ? [{ label: "จัดการสิทธิ์ Head", labelEn: "Heads", href: "/admin/heads", icon: "group" } as NavItem] : []),
  ];
  const roleLabel = session?.me.subsystemRole === "ADMIN" ? "ผู้ดูแลเว็บกิจกรรม"
    : session?.canCreate ? "หัวหน้าห้อง" : session?.me.subsystemRole === "STUDENT" ? "นักศึกษา"
    : session?.me.subsystemRole === "STAFF" ? "บุคลากร" : session ? "ผู้เข้าชม / ศิษย์เก่า" : "ยังไม่ได้เข้าสู่ระบบ";
  return (
    <html
      lang="th"
      className={`${jakarta.variable} ${notoSansThai.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-on-surface">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface-container-lowest focus:p-3">ข้ามไปเนื้อหา</a>
        <CsmjuAppShell
          displayName="Department Activity Planner"
          nav={nav}
          primaryAction={session?.canCreate ? { label: "สร้างกิจกรรม", href: "/activities/create" } : undefined}
          user={{ initials: session?.me.email.slice(0, 2).toUpperCase() || "CS", roleLabel }}
          coreHubUrl={process.env.CORE_HUB_WEB_URL}
        >
          <CoreSession signedIn={session !== null} available={available} />
          {session && <section aria-label="บัญชีที่เข้าสู่ระบบ" className="flex min-w-0 flex-wrap items-center justify-end gap-2 text-body-md leading-relaxed text-on-surface-variant">
            <span>บัญชีที่เข้าสู่ระบบ:</span><span className="min-w-0 break-words font-medium text-on-surface">{session.me.email || session.me.id}</span>
          </section>}
          <div id="main-content" className="min-w-0 text-body-md leading-relaxed [&_h1]:font-display [&_h2]:font-display [&_h3]:font-display [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-4 [&_a]:focus-visible:outline-accent [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-4 [&_button]:focus-visible:outline-accent" tabIndex={-1}>{children}</div>
        </CsmjuAppShell>
      </body>
    </html>
  );
}
