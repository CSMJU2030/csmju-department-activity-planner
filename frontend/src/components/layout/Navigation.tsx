"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navigation({ canCreate = false, signedIn = false, isAdmin = false }: { canCreate?: boolean; signedIn?: boolean; isAdmin?: boolean }) {
  const pathname = usePathname();
  return <header className="site-header"><div className="nav-inner">
    <Link href="/" className="brand" aria-label="CSMJU2030 หน้ารวมกิจกรรม"><span className="brand-mark" aria-hidden="true">C<span>2030</span></span><span><strong>CSMJU2030</strong><small>พื้นที่กิจกรรมของนักศึกษา</small></span></Link>
    <nav aria-label="เมนูหลัก" className="main-nav">
      <Link href="/" aria-current={pathname === "/" ? "page" : undefined}>สำรวจกิจกรรม</Link>
      <Link href="/my-activities" aria-current={pathname === "/my-activities" ? "page" : undefined}>กิจกรรมของฉัน</Link>
      {isAdmin && <Link href="/admin/heads" aria-current={pathname === "/admin/heads" ? "page" : undefined}>จัดการสิทธิ์ Head</Link>}
    </nav>
    {canCreate && <Link href="/activities/create" className="primary-link">+ สร้างกิจกรรม</Link>}
    {signedIn && <form action="/auth/logout" method="post" onSubmit={() => sessionStorage.removeItem("activity-planner:was-signed-in")}><button type="submit" className="secondary-link">ออกจากระบบ</button></form>}
  </div></header>;
}
