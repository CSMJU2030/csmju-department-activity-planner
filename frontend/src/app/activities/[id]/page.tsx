import { activityStatusLabels, formatActivityDate } from "@/lib/activity-presentation";
import Link from "next/link";
import { getActivity, getParticipation, listRoles } from "@/lib/api";
import { getSession, unwrap } from "@/lib/session";
import { SignedOut } from "@/components/layout/SignedOut";
import {
  applyTeamRoleAction,
} from "@/app/actions/activity";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EvaluationForm } from "@/components/ui/EvaluationForm";
import { RegistrationForm } from "@/components/ui/RegistrationForm";
import { ActionForm } from "@/components/ui/ActionForm";

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return <SignedOut />;
  const currentUser = session.me;
  const activity = unwrap(await getActivity(id));
  const activityRoles = unwrap(await listRoles(id));
  const { myApplication, hasEvaluated, isRegistered } = unwrap(await getParticipation(id));

  const isFull = activity.currentParticipants >= activity.maxParticipants;
  const remainingSeats =
    activity.maxParticipants - activity.currentParticipants;

  return (
    <main className="p-8 max-w-2xl mx-auto space-y-6">
      {/* ส่วนหัว: ปุ่มย้อนกลับ และ ทางลัดไปหน้าจัดการ (Organizer Mode) */}
      <div className="flex justify-between items-center">
        <Link href="/" className="text-sm text-primary hover:underline">
          &larr; กลับหน้ารายการกิจกรรม
        </Link>
        {activity.createdBy === currentUser.id && <Link
          href={`/organizer/${activity.id}/manage`}
          className="text-label-md bg-primary-container/10 text-primary-container px-3 py-1.5 rounded-lg hover:bg-primary-container/20 transition-colors border border-primary-container/20"
        >
          จัดการกิจกรรม (Organizer) &rarr;
        </Link>}
      </div>

      {/* บล็อกข้อมูลหลักของกิจกรรม */}
      <Card className="space-y-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <Badge variant="info">{activity.category}</Badge>
            <h1 className="text-2xl font-bold text-primary mt-2">
              {activity.title}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              ผู้จัด: {activity.creatorName}
            </p>
          </div>
          <span
            className={`text-sm px-2.5 py-1 rounded-full font-medium shrink-0 ${
              activity.status === "COMPLETED"
                ? "bg-surface-variant text-on-surface-variant"
                : isFull
                  ? "bg-error-container text-on-error-container"
                  : "bg-success/10 text-emerald-700"
            }`}
          >
            {activityStatusLabels[activity.status]}
          </span>
        </div>

        <div className="space-y-2 text-sm text-on-surface border-y border-outline-variant/40 py-4">
          <p>
            <strong>สถานที่:</strong> {activity.location}
          </p>
          <p>
            <strong>จำนวนที่เปิดรับ:</strong> {activity.maxParticipants} คน{" "}
            <span className="text-primary font-medium">
              (ว่างอีก {remainingSeats} ที่นั่ง)
            </span>
          </p>
          <p>
            <strong>เวลาจัดกิจกรรม:</strong> {formatActivityDate(activity.startAt)} -{" "}
            {formatActivityDate(activity.endAt)}
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-bold text-on-surface">
            รายละเอียดกิจกรรม
          </h2>
          <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line">
            {activity.description}
          </p>
        </div>

        {/* ฟอร์มลงทะเบียนเข้าร่วม */}
        {isRegistered ? (
          <p className="text-sm text-primary leading-[1.6]">
            คุณลงทะเบียนแล้ว — <Link href="/my-activities" className="underline">จัดการการลงทะเบียน</Link>
          </p>
        ) : (
          <RegistrationForm activityId={activity.id} mode="register"
            disabled={!currentUser || isFull || activity.status !== "OPEN"} />
        )}
      </Card>

      {/* ส่วนประเมินผลกิจกรรม (แสดงเมื่อสถานะเป็น COMPLETED) */}
      {activity.status === "COMPLETED" && (
        <div>
          {hasEvaluated ? (
            <Card className="text-center py-4 bg-success/10 border-success/20">
              <p className="text-sm font-semibold text-emerald-700">
                คุณได้ส่งแบบประเมินกิจกรรมนี้เรียบร้อยแล้ว
                ขอบคุณสำหรับความคิดเห็น
              </p>
            </Card>
          ) : isRegistered ? (
            <EvaluationForm activityId={activity.id} />
          ) : (
            <Card><p className="text-body-md text-on-surface">เฉพาะผู้ที่ลงทะเบียนเข้าร่วมกิจกรรมนี้เท่านั้นที่ประเมินได้</p></Card>
          )}
        </div>
      )}

      {/* บล็อกรับสมัครทีมงานช่วยจัดกิจกรรม */}
      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-primary">
          เปิดรับสมัครทีมงานช่วยจัดกิจกรรม ({activityRoles.length} ตำแหน่ง)
        </h2>

        {myApplication && (
          <div className="p-3 bg-primary-container/10 rounded-lg text-sm text-primary font-medium">
            สถานะใบสมัครของคุณ: {myApplication.status} (
            {myApplication.status === "ACCEPTED"
              ? "ผ่านการคัดเลือกแล้ว"
              : myApplication.status === "REJECTED"
                ? "ไม่ผ่านการคัดเลือก"
                : "รอผู้จัดพิจารณา"}
            )
          </div>
        )}

        <div className="space-y-3">
          {activityRoles.map((role) => (
            <div
              key={role.id}
              className="p-3 border border-outline-variant/40 rounded-lg flex justify-between items-center bg-surface/50"
            >
              <div>
                <h4 className="font-semibold text-sm text-on-surface">
                  {role.roleName}
                </h4>
                <p className="text-sm text-gray-500 mt-0.5">
                  {role.description}
                </p>
                <span className="text-sm text-on-surface-variant mt-1 block">
                  ต้องการ: {role.maxMembers} คน
                </span>
              </div>

              <ActionForm
                label={myApplication?.roleId === role.id ? "สมัครแล้ว" : "สมัครตำแหน่งนี้"}
                variant="outline"
                disabled={!currentUser || Boolean(myApplication) || !["OPEN", "FULL"].includes(activity.status)}
                action={async () => {
                  "use server";
                  return applyTeamRoleAction(activity.id, role.id);
                }}
              />
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}
