import Link from "next/link";
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
    <main className="dashboard-shell space-y-6">
      {/* Header ส่วนหัวของหน้า */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold">รายชื่อผู้สมัครกิจกรรมทั้งหมด</h1>
          <p className="muted text-sm mt-1">
            ตรวจสอบรายชื่อผู้ลงทะเบียนในทุกกิจกรรมที่คุณเป็นผู้จัด
          </p>
        </div>
        <Link href="/my-activities" className="secondary-link self-start sm:self-auto">
          ← กลับไปกิจกรรมของฉัน
        </Link>
      </div>

      {/* กรณีที่ยังไม่มีกิจกรรมที่สร้าง */}
      {activities.length === 0 ? (
        <section className="empty-panel">
          <span className="empty-symbol" aria-hidden="true">📋</span>
          <h2 className="text-xl font-semibold">ยังไม่มีกิจกรรมที่คุณสร้าง</h2>
          <p className="mt-2 text-muted">
            เมื่อคุณสร้างกิจกรรมและมีเพื่อนลงทะเบียน รายชื่อจะปรากฏที่หน้านี้
          </p>
          <div className="mt-4">
            <Link href="/activities/create" className="primary-link">
              สร้างกิจกรรมใหม่ ↗
            </Link>
          </div>
        </section>
      ) : (
        <div className="space-y-6">
          {activities.map((activity) => (
            <section key={activity.id} className="workspace-card space-y-4">
              {/* รายละเอียดของแต่ละกิจกรรม */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-primary">{activity.title}</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-surface-variant font-medium">
                      {activity.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-1">
                    ผู้ลงทะเบียน: <strong className="text-foreground">{activity.registrations.length}</strong> / {activity.maxParticipants} คน
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/organizer/${activity.id}/manage`}
                    className="secondary-link text-label-md py-1 px-3"
                  >
                    จัดการกิจกรรม
                  </Link>
                  <Link
                    href={`/activities/${activity.id}`}
                    className="primary-link text-label-md py-1 px-3"
                  >
                    ดูหน้ากิจกรรม
                  </Link>
                </div>
              </div>

              {/* ตารางแสดงรายชื่อผู้ลงทะเบียน */}
              {activity.registrations.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted">
                  ยังไม่มีผู้ลงทะเบียนในกิจกรรมนี้
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted text-label-md">
                        <th className="py-2.5 px-3 w-16">ลำดับ</th>
                        <th className="py-2.5 px-3">รหัสผู้ใช้งาน (User ID)</th>
                        <th className="py-2.5 px-3 text-right">วันเวลาที่ลงทะเบียน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {activity.registrations.map((reg, index) => (
                        <tr key={reg.id} className="hover:bg-surface-variant/50 transition-colors">
                          <td className="py-3 px-3 text-muted">{index + 1}</td>
                          <td className="py-3 px-3 font-mono font-medium">{reg.coreUserId}</td>
                          <td className="py-3 px-3 text-right text-muted">
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
    </main>
  );
}
