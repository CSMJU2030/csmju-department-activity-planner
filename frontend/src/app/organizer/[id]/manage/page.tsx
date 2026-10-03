import Link from "next/link";
import { redirect } from "next/navigation";
import { getActivity, listApplications, listRoles } from "@/lib/api";
import { getSession, unwrap } from "@/lib/session";
import { SignedOut } from "@/components/layout/SignedOut";
import {
  respondTeamApplicationAction,
  createActivityRoleAction,
  updateActivityStatusAction,
} from "@/app/actions/activity";
import { Card } from "@/components/ui/Card";
import { ActionForm } from "@/components/ui/ActionForm";
import { Badge } from "@/components/ui/Badge";

export default async function OrganizerManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return <SignedOut />;
  const activity = unwrap(await getActivity(id));
  if (activity.createdBy !== session.me.id) redirect(`/activities/${id}`);

  const activityRoles = unwrap(await listRoles(id));
  const applications = unwrap(await listApplications(id));

  return (
    <main className="p-8 max-w-4xl mx-auto space-y-6 leading-[1.6]">
      {/* ส่วนหัวหน้าจัดการและปุ่มเปลี่ยนเส้นทาง */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <Link
            href={`/activities/${activity.id}`}
            className="text-sm text-primary hover:underline"
          >
            &larr; ดูหน้ารายละเอียดกิจกรรม
          </Link>
          <h1 className="text-2xl font-bold text-primary mt-2">
            จัดการกิจกรรม: {activity.title}
          </h1>
          <p className="text-sm text-on-surface">
            พื้นที่สำหรับผู้จัดกิจกรรมคัดเลือกทีมงานและควบคุมสถานะกิจกรรม
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/activities/${activity.id}/edit`}
            className="text-sm bg-surface-container-lowest text-on-surface border border-outline-variant px-3 py-1.5 rounded font-medium hover:bg-surface transition-colors"
          >
            แก้ไขกิจกรรม
          </Link>
          <Link
            href={`/organizer/${activity.id}/summary`}
            className="text-sm bg-primary text-white px-3 py-1.5 rounded font-medium hover:opacity-90 transition-opacity"
          >
            ดูสรุปผลประเมิน & Improvement &rarr;
          </Link>
          <Badge variant="info">Organizer Mode</Badge>
        </div>
      </div>

      {/* บล็อกควบคุมสถานะกิจกรรม */}
      <Card className="space-y-3 bg-surface">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <span className="text-sm text-gray-500 block">
              สถานะกิจกรรมปัจจุบัน
            </span>
            <span className="text-base font-bold text-primary">
              {activity.status}
            </span>
          </div>
          <ActionForm
            label="เปลี่ยนสถานะ"
            action={async (formData: FormData) => {
              "use server";
              const status = formData.get("status");
              return updateActivityStatusAction(activity.id, status);
            }}
          >
            <label htmlFor="activity-status">สถานะใหม่</label>
            <select
              id="activity-status"
              name="status"
              defaultValue={activity.status}
              className="text-sm px-3 py-1.5 rounded border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none"
            >
              <option value="OPEN">OPEN (เปิดรับสมัคร)</option>
              <option value="FULL">FULL (ที่นั่งเต็ม)</option>
              <option value="IN_PROGRESS">IN_PROGRESS (กำลังจัดกิจกรรม)</option>
              <option value="COMPLETED">
                COMPLETED (กิจกรรมสิ้นสุดแล้ว / เปิดประเมิน)
              </option>
              <option value="CANCELLED">CANCELLED (ยกเลิกกิจกรรม)</option>
            </select>
          </ActionForm>
        </div>
      </Card>

      {/* บล็อกสรุปภาพรวมโควตาตำแหน่งทีมงาน */}
      <div>
        <div className="section-heading mb-3">
          <h2 className="text-base font-bold text-primary">ตำแหน่งทีมงานที่เปิดรับ</h2>
          <span className="muted">{activityRoles.length} ตำแหน่ง</span>
        </div>
        <Card className="mb-4">
          <ActionForm
            label="เพิ่มตำแหน่งทีมงาน"
            action={async (formData: FormData) => {
              "use server";
              return createActivityRoleAction(activity.id, formData);
            }}
          >
            <div className="form-two-columns">
              <label className="space-y-1">ชื่อตำแหน่ง *<input name="roleName" required maxLength={100} placeholder="เช่น พิธีกร / ผู้ช่วยวิทยากร" className="w-full px-3 py-2 text-sm rounded-lg border border-outline-variant" /></label>
              <label className="space-y-1">จำนวนที่รับ *<input name="maxMembers" required min={1} max={999} type="number" defaultValue={1} className="w-full px-3 py-2 text-sm rounded-lg border border-outline-variant" /></label>
            </div>
            <label className="space-y-1 block">หน้าที่และรายละเอียด<textarea name="roleDescription" maxLength={500} rows={2} placeholder="อธิบายหน้าที่ของทีมงานตำแหน่งนี้" className="w-full px-3 py-2 text-sm rounded-lg border border-outline-variant" /></label>
          </ActionForm>
        </Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activityRoles.map((role) => {
            const acceptedMembers = applications.filter(
              (m) => m.roleId === role.id && m.status === "ACCEPTED"
            );
            const isRoleFull = acceptedMembers.length >= role.maxMembers;

            return (
              <Card key={role.id} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-on-surface text-sm">
                    {role.roleName}
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      isRoleFull ? "text-emerald-700" : "text-primary"
                    }`}
                  >
                    {acceptedMembers.length} / {role.maxMembers} คน
                  </span>
                </div>
                <p className="text-sm text-gray-500">{role.description}</p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* บล็อกรายชื่อผู้สมัครช่วยจัดกิจกรรมและ Action คัดเลือก */}
      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-primary">
          รายชื่อผู้สมัครช่วยจัดกิจกรรม ({applications.length})
        </h2>

        {applications.length === 0 ? (
          <p className="text-sm text-on-surface-variant py-6 text-center">
            ยังไม่มีผู้สมัครช่วยงานในขณะนี้
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {applications.map((app) => {
              const role = activityRoles.find((r) => r.id === app.roleId);
              return (
                <div
                  key={app.id}
                  className="py-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-sm"
                >
                  <div>
                    <span className="font-medium text-on-surface block">
                      {app.userName}
                    </span>
                    <span className="text-sm text-on-surface-variant">
                      สมัครตำแหน่ง: <strong>{role?.roleName}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm px-2.5 py-1 rounded font-medium ${
                        app.status === "ACCEPTED"
                          ? "bg-success/10 text-emerald-700"
                          : app.status === "REJECTED"
                          ? "bg-error-container text-on-error-container"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {app.status}
                    </span>

                    {app.status === "PENDING" && (activity.status === "OPEN" || activity.status === "FULL") && (
                      <div className="flex gap-3 ml-2">
                        <ActionForm
                          action={respondTeamApplicationAction.bind(null, activity.id, app.id, "ACCEPTED")}
                          label="รับเข้าทีม"
                        />
                        <ActionForm
                          action={respondTeamApplicationAction.bind(null, activity.id, app.id, "REJECTED")}
                          label="ปฏิเสธ"
                          variant="outline"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </main>
  );
}
