import Link from "next/link";
import { DescriptionIcon } from "@/csmju";
import { SignedOut } from "@/components/layout/SignedOut";
import { getOrganizedActivities } from "@/lib/api";
import { getSession, unwrap } from "@/lib/session";

export const metadata = {
  title: "รายชื่อผู้สมัครกิจกรรมทั้งหมด | CSMJU Activity",
};

export default async function MyActivitiesParticipantsPage() {
  const session = await getSession();
  if (!session) return <SignedOut />;

  const activities = unwrap(await getOrganizedActivities());

  return (
    <section className="flex min-w-0 flex-col gap-8 text-body-md leading-relaxed [&_h1]:font-display [&_h1]:text-headline-md md:[&_h1]:text-headline-lg [&_h2]:font-display [&_h2]:text-headline-md [&_h3]:font-display [&_h3]:text-body-lg [&_h3]:font-semibold space-y-6">
      {/* Header ส่วนหัวของหน้า */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-5">
        <div>
          <h1 className="text-2xl font-bold">รายชื่อผู้สมัครกิจกรรมทั้งหมด</h1>
          <p className="text-body-md leading-relaxed text-on-surface-variant text-sm mt-1">
            ตรวจสอบรายชื่อผู้ลงทะเบียนในทุกกิจกรรมที่คุณเป็นผู้จัด
          </p>
        </div>
        <Link href="/my-activities" className="inline-flex items-center justify-center min-h-11 rounded-lg border border-outline-variant px-4 py-2.5 text-label-md text-on-surface-variant transition-colors hover:bg-surface-variant/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent self-start sm:self-auto">
          ← กลับไปกิจกรรมของฉัน
        </Link>
      </div>

      {/* กรณีที่ยังไม่มีกิจกรรมที่สร้าง */}
      {activities.length === 0 ? (
        <section className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest text-center p-8 [&_h3]:text-headline-md [&_h3]:mt-3 [&_h3]:mb-2 [&_p]:text-body-md [&_p]:text-on-surface-variant [&_p]:mb-6">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-container/10 text-primary-container" aria-hidden="true"><DescriptionIcon className="h-6 w-6" /></span>
          <h2 className="text-xl font-semibold">ยังไม่มีกิจกรรมที่คุณสร้าง</h2>
          <p className="mt-2 text-on-surface-variant">
            เมื่อคุณสร้างกิจกรรมและมีเพื่อนลงทะเบียน รายชื่อจะปรากฏที่หน้านี้
          </p>
          <div className="mt-4">
            <Link href="/activities/create" className="btn-gradient inline-flex items-center justify-center min-h-11 rounded-lg px-4 py-2.5 text-label-md text-white shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-50">
              สร้างกิจกรรมใหม่ ↗
            </Link>
          </div>
        </section>
      ) : (
        <div className="space-y-6">
          {activities.map((activity) => (
            <section key={activity.id} className="min-w-0 rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-sm p-6 space-y-4">
              {/* รายละเอียดของแต่ละกิจกรรม */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-primary">{activity.title}</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-surface-variant font-medium">
                      {activity.category}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    ผู้ลงทะเบียน: <strong className="text-foreground">{activity.registrations.length}</strong> / {activity.maxParticipants} คน
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/organizer/${activity.id}/manage`}
                    className="inline-flex items-center justify-center min-h-11 rounded-lg border border-outline-variant px-4 py-2.5 text-label-md text-on-surface-variant transition-colors hover:bg-surface-variant/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent text-label-md py-1 px-3"
                  >
                    จัดการกิจกรรม
                  </Link>
                  <Link
                    href={`/activities/${activity.id}`}
                    className="btn-gradient inline-flex items-center justify-center min-h-11 rounded-lg px-4 py-2.5 text-label-md text-white shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-50 text-label-md py-1 px-3"
                  >
                    ดูหน้ากิจกรรม
                  </Link>
                </div>
              </div>

              {/* ตารางแสดงรายชื่อผู้ลงทะเบียน */}
              {activity.registrations.length === 0 ? (
                <div className="py-6 text-center text-sm text-on-surface-variant">
                  ยังไม่มีผู้ลงทะเบียนในกิจกรรมนี้
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-outline-variant text-on-surface-variant text-label-md">
                        <th className="py-2.5 px-3 w-16">ลำดับ</th>
                        <th className="py-2.5 px-3">รหัสผู้ใช้งาน (User ID)</th>
                        <th className="py-2.5 px-3 text-right">วันเวลาที่ลงทะเบียน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {activity.registrations.map((reg, index) => (
                        <tr key={reg.id} className="hover:bg-surface-variant/50 transition-colors">
                          <td className="py-3 px-3 text-on-surface-variant">{index + 1}</td>
                          <td className="py-3 px-3 font-mono font-medium">{reg.coreUserId}</td>
                          <td className="py-3 px-3 text-right text-on-surface-variant">
                            {new Date(reg.createdAt).toLocaleString("th-TH", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
