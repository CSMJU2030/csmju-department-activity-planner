import { call } from "@/lib/api";
import { getSession, unwrap } from "@/lib/session";
import { SignedOut } from "@/components/layout/SignedOut";
import { ActionForm } from "@/components/ui/ActionForm";
import { grantHeadAction, revokeHeadAction } from "@/app/actions/heads";

type Head = { coreUserId: string; active: boolean; grantedBy: string; grantedAt: string; revokedBy: string | null; revokedAt: string | null };
const date = (value: string) => new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(new Date(value));

export const metadata = { title: "จัดการสิทธิ์ Head | CSMJU2030" };

export default async function HeadsPage() {
  const session = await getSession();
  if (!session) return <SignedOut />;
  if (session.me.coreRole !== "admin") return <main className="dashboard-shell"><div className="empty-panel"><h1>คุณไม่มีสิทธิ์เข้าหน้านี้</h1><p>เฉพาะผู้ดูแลระบบเท่านั้นที่แต่งตั้งและถอนสิทธิ์ Head ได้</p></div></main>;
  const heads = unwrap(await call<Head[]>("/api/v1/admin/activity-heads"));
  return <main className="dashboard-shell">
    <div className="page-intro"><div><p className="eyebrow">ผู้ดูแลระบบ</p><h1>จัดการสิทธิ์ Head</h1><p className="muted">แต่งตั้งนักศึกษาที่รับผิดชอบสร้างกิจกรรม สิทธิ์นี้ใช้เฉพาะระบบกิจกรรมของเรา</p></div></div>
    <section className="workspace-card space-y-4"><h2 className="text-xl font-semibold">แต่งตั้ง Head</h2>
      <p className="muted">ใช้รหัสผู้ใช้ (sub) จริงจาก Core ผู้ได้รับสิทธิ์ต้องเข้าสู่ระบบด้วยบทบาทนักศึกษา รหัสอาจไม่ใช่ UUID และระบบยังไม่ตรวจรายชื่อผู้ใช้กับ Core อัตโนมัติ</p>
      <ActionForm action={grantHeadAction} label="แต่งตั้ง Head">
        <label className="block space-y-2"><span>รหัสผู้ใช้ Core *</span><input name="coreUserId" required maxLength={64} autoComplete="off" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" aria-describedby="head-id-help" /></label>
        <p id="head-id-help" className="muted">ตรวจรหัสกับผู้ดูแล Core ให้ถูกต้องก่อนแต่งตั้ง ไม่กรอกอีเมลแทนรหัสผู้ใช้</p>
      </ActionForm>
    </section>
    <section className="space-y-4"><h2 className="text-xl font-semibold">รายการสิทธิ์ ({heads.length})</h2>
      {!heads.length && <div className="empty-panel"><h3>ยังไม่มีผู้ได้รับสิทธิ์ Head</h3><p>แต่งตั้งนักศึกษาจากแบบฟอร์มด้านบนเพื่อให้เริ่มสร้างกิจกรรมได้</p></div>}
      {heads.map(head => <article className="workspace-card space-y-3" key={head.coreUserId}>
        <div className="section-heading"><h3 className="break-all">{head.coreUserId}</h3><span className="status-pill">{head.active ? "มีสิทธิ์สร้างกิจกรรม" : "ถอนสิทธิ์แล้ว"}</span></div>
        <p className="muted break-all">แต่งตั้งโดย {head.grantedBy} · {date(head.grantedAt)}</p>
        {head.revokedAt && <p className="muted break-all">ถอนสิทธิ์โดย {head.revokedBy} · {date(head.revokedAt)}</p>}
        <ActionForm action={head.active ? revokeHeadAction : grantHeadAction} label={head.active ? "ถอนสิทธิ์สร้างกิจกรรม" : "แต่งตั้งอีกครั้ง"} variant="outline"><input type="hidden" name="coreUserId" value={head.coreUserId} /></ActionForm>
      </article>)}
      <p className="muted">การถอนสิทธิ์หยุดการสร้างกิจกรรมใหม่ ส่วนกิจกรรมเดิมยังจัดการได้โดยเจ้าของตามปกติ</p>
    </section>
  </main>;
}
