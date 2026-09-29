import Link from "next/link";
import { listAllActivities } from "@/lib/api";
import { getSession, unwrap } from "@/lib/session";
import { SignedOut } from "@/components/layout/SignedOut";
import { ActivityCatalog } from "@/components/activities/ActivityCatalog";

export default async function Home() {
  const session = await getSession();
  if (!session) return <SignedOut />;
  const activities = unwrap(await listAllActivities());
  const canCreate = session.canCreate;
  const openCount = activities.filter(a => a.status === "OPEN").length;
  return <main className="dashboard-shell">
    <section className="hero-panel"><div className="hero-copy"><p className="eyebrow">CSMJU · STUDENT ACTIVITIES</p><h1>พื้นที่ของไอเดีย<br />และประสบการณ์ใหม่</h1><p>ค้นหากิจกรรมที่ใช่ ร่วมทีมกับเพื่อน<br className="hidden sm:block" />และเปลี่ยนทุกประสบการณ์ให้เป็นการเรียนรู้</p><div className="flex flex-wrap gap-3"><a href="#catalog-title" className="primary-link">สำรวจกิจกรรม ↓</a><Link href="/my-activities" className="secondary-link">ดูกิจกรรมของฉัน →</Link></div></div><div className="hero-note"><span className="note-number">{String(openCount).padStart(2,"0")}</span><strong>กิจกรรมที่เปิดรับสมัคร</strong><p>เลือกเข้าร่วมในสิ่งที่สนใจ<br />หรือร่วมเป็นทีมงานช่วยจัดกิจกรรม</p>{canCreate && <Link href="/activities/create">เริ่มสร้างกิจกรรมใหม่ ↗</Link>}</div></section>
    <ActivityCatalog activities={activities} />
  </main>;
}
