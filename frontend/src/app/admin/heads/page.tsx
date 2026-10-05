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
  if (session.me.subsystemRole !== "ADMIN") return <section className="flex min-w-0 flex-col gap-8 text-body-md leading-relaxed [&_h1]:font-display [&_h1]:text-headline-md md:[&_h1]:text-headline-lg [&_h2]:font-display [&_h2]:text-headline-md [&_h3]:font-display [&_h3]:text-body-lg [&_h3]:font-semibold"><div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest text-center p-8 [&_h3]:text-headline-md [&_h3]:mt-3 [&_h3]:mb-2 [&_p]:text-body-md [&_p]:text-on-surface-variant [&_p]:mb-6"><h1>คุณไม่มีสิทธิ์เข้าหน้านี้</h1><p>เฉพาะผู้ดูแลระบบเท่านั้นที่แต่งตั้งและถอนสิทธิ์ Head ได้</p></div></section>;
  const heads = unwrap(await call<Head[]>("/api/v1/admin/activity-heads"));
  return <section className="flex min-w-0 flex-col gap-8 text-body-md leading-relaxed [&_h1]:font-display [&_h1]:text-headline-md md:[&_h1]:text-headline-lg [&_h2]:font-display [&_h2]:text-headline-md [&_h3]:font-display [&_h3]:text-body-lg [&_h3]:font-semibold">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-label-md text-primary-container">ผู้ดูแลระบบ</p><h1>จัดการสิทธิ์ Head</h1><p className="text-body-md leading-relaxed text-on-surface-variant">แต่งตั้งนักศึกษาที่รับผิดชอบสร้างกิจกรรม สิทธิ์นี้ใช้เฉพาะระบบกิจกรรมของเรา</p></div></div>
    <section className="min-w-0 rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-sm p-6 space-y-4"><h2 className="text-xl font-semibold">แต่งตั้ง Head</h2>
      <p className="text-body-md leading-relaxed text-on-surface-variant">ใช้รหัสผู้ใช้ (sub) จริงจาก Core ผู้ได้รับสิทธิ์ต้องเข้าสู่ระบบด้วยบทบาทนักศึกษา รหัสอาจไม่ใช่ UUID และระบบยังไม่ตรวจรายชื่อผู้ใช้กับ Core อัตโนมัติ</p>
      <ActionForm action={grantHeadAction} label="แต่งตั้ง Head">
        <label className="block space-y-2"><span>รหัสผู้ใช้ Core *</span><input name="coreUserId" required maxLength={64} autoComplete="off" className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md" aria-describedby="head-id-help" /></label>
        <p id="head-id-help" className="text-body-md leading-relaxed text-on-surface-variant">ตรวจรหัสกับผู้ดูแล Core ให้ถูกต้องก่อนแต่งตั้ง ไม่กรอกอีเมลแทนรหัสผู้ใช้</p>
      </ActionForm>
    </section>
    <section className="space-y-4"><h2 className="text-xl font-semibold">รายการสิทธิ์ ({heads.length})</h2>
      {!heads.length && <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest text-center p-8 [&_h3]:text-headline-md [&_h3]:mt-3 [&_h3]:mb-2 [&_p]:text-body-md [&_p]:text-on-surface-variant [&_p]:mb-6"><h3>ยังไม่มีผู้ได้รับสิทธิ์ Head</h3><p>แต่งตั้งนักศึกษาจากแบบฟอร์มด้านบนเพื่อให้เริ่มสร้างกิจกรรมได้</p></div>}
      {heads.map(head => <article className="min-w-0 rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-sm p-6 space-y-3" key={head.coreUserId}>
        <div className="flex flex-wrap items-center justify-between gap-4"><h3 className="break-words">{head.coreUserId}</h3><span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-label-sm bg-primary-container/10 text-primary-container">{head.active ? "มีสิทธิ์สร้างกิจกรรม" : "ถอนสิทธิ์แล้ว"}</span></div>
        <p className="text-body-md leading-relaxed text-on-surface-variant break-words">แต่งตั้งโดย {head.grantedBy} · {date(head.grantedAt)}</p>
        {head.revokedAt && <p className="text-body-md leading-relaxed text-on-surface-variant break-words">ถอนสิทธิ์โดย {head.revokedBy} · {date(head.revokedAt)}</p>}
        <ActionForm action={head.active ? revokeHeadAction : grantHeadAction} label={head.active ? "ถอนสิทธิ์สร้างกิจกรรม" : "แต่งตั้งอีกครั้ง"} variant="outline"><input type="hidden" name="coreUserId" value={head.coreUserId} /></ActionForm>
      </article>)}
      <p className="text-body-md leading-relaxed text-on-surface-variant">การถอนสิทธิ์หยุดการสร้างกิจกรรมใหม่ ส่วนกิจกรรมเดิมยังจัดการได้โดยเจ้าของตามปกติ</p>
    </section>
  </section>;
}
