"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SubsystemRole } from "@/lib/api";

const roleLabels: Record<SubsystemRole, string> = {
  ADMIN: "ผู้ดูแลเว็บกิจกรรม",
  STUDENT: "นักศึกษา",
  STAFF: "บุคลากร",
  ALUMNI: "ผู้เข้าชม / ศิษย์เก่า",
};

export function Navigation({ canCreate = false, signedIn = false, isAdmin = false, user }: { canCreate?: boolean; signedIn?: boolean; isAdmin?: boolean; user?: { email: string; subsystemRole: SubsystemRole } }) {
  const pathname = usePathname();
  return <header className="site-header"><div className="nav-inner">
    <Link href="/" className="brand" aria-label="CSMJU2030 หน้ารวมกิจกรรม"><span className="brand-mark" aria-hidden="true">C<span>2030</span></span><span><strong>CSMJU2030</strong><small>พื้นที่กิจกรรมของนักศึกษา</small></span></Link>
    {signedIn && <div className="nav-account">
      {user && <div className="flex min-w-0 items-center gap-3" aria-label="บัญชีที่เข้าสู่ระบบ">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary font-semibold" aria-hidden="true">{user.email.slice(0, 2).toUpperCase() || "CS"}</span>
        <div className="min-w-0 text-right text-sm text-on-surface">
          <p className="font-semibold break-words">{user.email || "บัญชี Core ของคุณ"}</p>
          <p className="text-on-surface-variant">{canCreate ? "หัวหน้าห้อง · สร้างกิจกรรมได้" : roleLabels[user.subsystemRole]}</p>
        </div>
      </div>}
      <form className="shrink-0" action="/auth/logout" method="post" onSubmit={() => sessionStorage.removeItem("activity-planner:was-signed-in")}><button type="submit" className="secondary-link">ออกจากระบบ</button></form>
    </div>}
    <nav aria-label="เมนูหลัก" className="main-nav">
      <Link href="/" aria-current={pathname === "/" ? "page" : undefined}>สำรวจกิจกรรม</Link>
      <Link href="/my-activities" aria-current={pathname === "/my-activities" ? "page" : undefined}>กิจกรรมของฉัน</Link>
      {isAdmin && <Link href="/admin/heads" aria-current={pathname === "/admin/heads" ? "page" : undefined}>จัดการสิทธิ์ Head</Link>}
    </nav>
    {canCreate && <Link href="/activities/create" className="primary-link">+ สร้างกิจกรรม</Link>}
  </div></header>;
}
