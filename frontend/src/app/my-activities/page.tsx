import Link from "next/link";
import { getMyActivities } from "@/lib/api";
import { getSession, unwrap } from "@/lib/session";
import { SignedOut } from "@/components/layout/SignedOut";
import { RegistrationForm } from "@/components/ui/RegistrationForm";
import { activityStatusLabels, applicationStatusLabels, formatActivityDate } from "@/lib/activity-presentation";

export default async function MyActivitiesPage() {
  const session = await getSession();
  if (!session) return <SignedOut />;
  const user = session.me;
  const { created, applications, registrations } = unwrap(await getMyActivities());
  const canCreate = session.canCreate;
  return <main className="dashboard-shell">
    <div className="page-intro">
      <div>
        <p className="eyebrow">MY ACTIVITY SPACE</p>
        <h1>กิจกรรมของฉัน</h1>
        <p className="muted">สวัสดี {user.email} · จัดการทุกบทบาทของคุณได้ในที่เดียว</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {created.length > 0 && (
          <Link href="/my-activities/participants" className="secondary-link">
            👥 ดูรายชื่อผู้สมัครทั้งหมด
          </Link>
        )}
        {canCreate && <Link href="/activities/create" className="primary-link">+ สร้างกิจกรรมใหม่</Link>}
      </div>
    </div>
    <nav className="stats-grid" aria-label="ข้ามไปส่วนกิจกรรม">
      {[{id:"registrations",label:"กิจกรรมที่เข้าร่วม",count:registrations.length,note:"ดูรายการและจัดการการลงทะเบียน",icon:"01"},{id:"created",label:"กิจกรรมที่ฉันสร้าง",count:created.length,note:"จัดการทีมงานและติดตามผล",icon:"02"},{id:"team",label:"ใบสมัครทีมงาน",count:applications.length,note:"ติดตามผลการคัดเลือก",icon:"03"}].map(item=><a key={item.id} href={"#"+item.id} className="stat-card"><div className="flex justify-between items-center"><span>{item.label}</span><span className="stat-icon" aria-hidden="true">{item.icon}</span></div><strong>{String(item.count).padStart(2,"0")}</strong><p>{item.note} <span aria-hidden="true">↘</span></p></a>)}
    </nav>
    <div className="workspace-grid"><div className="space-y-10">
      <section id="registrations" className="space-y-4"><div className="section-heading"><h2>กิจกรรมที่เข้าร่วม <span className="count-tag">{registrations.length}</span></h2><Link href="/" className="text-primary">สำรวจกิจกรรม →</Link></div>
        {registrations.length===0 ? <div className="empty-panel"><span className="empty-symbol" aria-hidden="true">＋</span><h3>ประสบการณ์ใหม่กำลังรอคุณอยู่</h3><p>คุณยังไม่ได้ลงทะเบียน ลองเลือกกิจกรรมที่สนใจ<br />แล้วกลับมาติดตามได้ที่หน้านี้</p><Link href="/" className="primary-link">ค้นหากิจกรรมที่ใช่ →</Link></div> : registrations.map(r=><article className="workspace-card" key={r.id}><div className="section-heading"><h3><Link href={"/activities/"+r.activityId}>{r.activity.title}</Link></h3><span className="status-pill" data-status={r.activity.status}>{activityStatusLabels[r.activity.status]}</span></div><p className="muted">{formatActivityDate(r.activity.startAt)} · {r.activity.location}</p><div className="card-bottom"><Link href={"/activities/"+r.activityId} className="secondary-link">ดูรายละเอียด →</Link>{["OPEN","FULL"].includes(r.activity.status) ? <RegistrationForm activityId={r.activityId} mode="cancel"/> : <p className="muted">ปิดการยกเลิกลงทะเบียนแล้ว</p>}</div></article>)}
      </section>
      <section id="created" className="space-y-4">
        <div className="section-heading">
          <h2>กิจกรรมที่ฉันสร้าง <span className="count-tag">{created.length}</span></h2>
          {created.length > 0 && (
            <Link href="/my-activities/participants" className="text-primary text-sm">
              ดูรายชื่อผู้สมัครทั้งหมด →
            </Link>
          )}
        </div>
        {created.length===0 ? <div className="empty-panel"><h3>ยังไม่มีกิจกรรมที่คุณสร้าง</h3>{canCreate ? <><p>สร้างกิจกรรมแล้วชวนเพื่อนมาร่วมทีมกัน</p><Link href="/activities/create" className="secondary-link">สร้างกิจกรรมแรก →</Link></> : <p>หัวหน้าห้องเป็นผู้สร้างกิจกรรม คุณสามารถเข้าร่วมหรือสมัครทีมงานได้</p>}</div> : created.map(a=><article key={a.id} className="workspace-card"><div className="section-heading"><h3><Link href={"/activities/"+a.id}>{a.title}</Link></h3><span className="status-pill" data-status={a.status}>{activityStatusLabels[a.status]}</span></div><p className="muted">{formatActivityDate(a.startAt)} · {a.location}</p><div className="card-bottom"><span className="muted">ผู้เข้าร่วม <strong className="text-on-surface">{a.currentParticipants} / {a.maxParticipants}</strong> คน</span><div className="flex flex-wrap gap-2"><Link href={"/organizer/"+a.id+"/summary"} className="secondary-link">สรุปผลประเมิน</Link><Link href={"/organizer/"+a.id+"/manage"} className="primary-link">จัดการกิจกรรม →</Link></div></div></article>)}
      </section>
      <section id="team" className="space-y-4"><div className="section-heading"><h2>ใบสมัครทีมงาน <span className="count-tag">{applications.length}</span></h2></div>{applications.length===0 ? <div className="empty-panel"><h3>มาร่วมสร้างกิจกรรมด้วยกัน</h3><p>สมัครตำแหน่งทีมงานจากหน้ารายละเอียดกิจกรรมที่สนใจ</p><Link href="/" className="secondary-link">ดูกิจกรรมทั้งหมด →</Link></div> : applications.map(app=>{const { activity, role } = app;return <article key={app.id} className="workspace-card"><div className="section-heading"><div><p className="eyebrow">{role?.roleName ?? "ไม่ระบุตำแหน่ง"}</p><h3>{activity?.title ?? "ไม่พบกิจกรรม"}</h3></div><span className="status-pill">{applicationStatusLabels[app.status]}</span></div>{activity && <Link className="text-primary inline-block mt-4" href={"/activities/"+activity.id}>ดูรายละเอียดกิจกรรม →</Link>}</article>;})}</section>
    </div><aside className="guide-panel"><p className="eyebrow">พื้นที่ของทุกบทบาท</p><h2>หนึ่งคน<br />หลายประสบการณ์</h2><p>หัวหน้าห้องสร้างและจัดการกิจกรรม นักศึกษาทุกคนเข้าร่วมหรือสมัครเป็นทีมงานได้</p><ol><li><strong>เลือกกิจกรรมที่สนใจ</strong><span>ลงทะเบียนจากหน้ารายละเอียด</span></li><li><strong>ร่วมเป็นส่วนหนึ่งของทีม</strong><span>สมัครตำแหน่งที่อยากลอง</span></li><li><strong>ส่งต่อสิ่งที่ได้เรียนรู้</strong><span>ประเมินเมื่อกิจกรรมจบ เพื่อช่วยพัฒนาครั้งต่อไป</span></li></ol></aside></div>
  </main>;
}
