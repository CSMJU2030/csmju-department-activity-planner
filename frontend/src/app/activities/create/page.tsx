import Link from "next/link";
import { getSession } from "@/lib/session";
import { CreateActivityForm } from "@/components/activities/CreateActivityForm";
import { SignedOut } from "@/components/layout/SignedOut";

export default async function CreateActivityPage() {
  const session = await getSession();
  if (!session) return <SignedOut />;
  const user = session?.me ?? null;
  return <section className="flex min-w-0 flex-col gap-8 text-body-md leading-relaxed [&_h1]:font-display [&_h1]:text-headline-md md:[&_h1]:text-headline-lg [&_h2]:font-display [&_h2]:text-headline-md [&_h3]:font-display [&_h3]:text-body-lg [&_h3]:font-semibold">
    <div className="space-y-4">
      <Link href="/my-activities" className="text-primary text-sm hover:underline">← กลับไปกิจกรรมของฉัน</Link>
      <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-label-md text-primary-container">CREATE AN ACTIVITY</p><h1>เริ่มต้นกิจกรรมของคุณ</h1><p className="text-body-md leading-relaxed text-on-surface-variant">เปลี่ยนไอเดียให้เป็นประสบการณ์ที่ทุกคนได้มีส่วนร่วม · ช่องที่มี * จำเป็นต้องกรอก</p></div></div>
    </div>
    {session?.canCreate ? <CreateActivityForm /> : <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest text-center p-8 [&_h3]:text-headline-md [&_h3]:mt-3 [&_h3]:mb-2 [&_p]:text-body-md [&_p]:text-on-surface-variant [&_p]:mb-6"><h2>{user ? "เจ้าหน้าที่ อาจารย์ และนักศึกษาที่เป็นหัวหน้าห้องสามารถสร้างกิจกรรมได้" : "กรุณาเข้าสู่ระบบผ่าน CSMJU2030 ก่อนสร้างกิจกรรม"}</h2><Link href="/" className="inline-flex items-center justify-center min-h-11 rounded-lg border border-outline-variant px-4 py-2.5 text-label-md text-on-surface-variant transition-colors hover:bg-surface-variant/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">สำรวจกิจกรรม →</Link></div>}
  </section>;
}
