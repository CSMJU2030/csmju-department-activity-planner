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
  return <section className="flex min-w-0 flex-col gap-8 text-body-md leading-relaxed [&_h1]:font-display [&_h1]:text-headline-md md:[&_h1]:text-headline-lg [&_h2]:font-display [&_h2]:text-headline-md [&_h3]:font-display [&_h3]:text-body-lg [&_h3]:font-semibold">
    <section className="grid grid-cols-1 md:grid-cols-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest overflow-hidden shadow-sm"><div className="p-6 md:p-8 md:col-span-2 [&_h1]:my-4 [&_p]:mb-4"><p className="text-label-md text-primary-container">CSMJU · STUDENT ACTIVITIES</p><h1>พื้นที่ของไอเดีย<br />และประสบการณ์ใหม่</h1><p>ค้นหากิจกรรมที่ใช่ ร่วมทีมกับเพื่อน<br className="hidden sm:block" />และเปลี่ยนทุกประสบการณ์ให้เป็นการเรียนรู้</p><div className="flex flex-wrap gap-3"><a href="#catalog-title" className="btn-gradient inline-flex items-center justify-center min-h-11 rounded-lg px-4 py-2.5 text-label-md text-white shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-50">สำรวจกิจกรรม ↓</a><Link href="/my-activities" className="inline-flex items-center justify-center min-h-11 rounded-lg border border-outline-variant px-4 py-2.5 text-label-md text-on-surface-variant transition-colors hover:bg-surface-variant/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">ดูกิจกรรมของฉัน →</Link></div></div><div className="p-6 md:p-8 flex flex-col justify-center bg-primary-container/10 text-primary-container [&_p]:my-4 [&_p]:text-on-surface-variant"><span className="font-display text-display-lg tabular-nums">{String(openCount).padStart(2,"0")}</span><strong>กิจกรรมที่เปิดรับสมัคร</strong><p>เลือกเข้าร่วมในสิ่งที่สนใจ<br />หรือร่วมเป็นทีมงานช่วยจัดกิจกรรม</p>{canCreate && <Link href="/activities/create">เริ่มสร้างกิจกรรมใหม่ ↗</Link>}</div></section>
    <ActivityCatalog activities={activities} />
  </section>;
}
