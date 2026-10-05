import Link from "next/link";
import { redirect } from "next/navigation";
import { getActivity, listEvaluations } from "@/lib/api";
import { getSession, unwrap } from "@/lib/session";
import { SignedOut } from "@/components/layout/SignedOut";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default async function ActivitySummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return <SignedOut />;
  const activity = unwrap(await getActivity(id));
  if (activity.createdBy !== session.me.id) redirect(`/activities/${id}`);

  const evals = unwrap(await listEvaluations(id));
  const avgRating =
    evals.length > 0
      ? (evals.reduce((sum, item) => sum + item.rating, 0) / evals.length).toFixed(1)
      : "0.0";

  return (
    <section className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <Link href={`/organizer/${activity.id}/manage`} className="text-sm text-primary hover:underline">
          &larr; กลับหน้าจัดการกิจกรรม
        </Link>
        <h1 className="text-2xl font-bold text-primary mt-2">
          Activity Improvement History
        </h1>
        <p className="text-sm text-on-surface">
          สรุปบทเรียนและผลประเมิน: <strong>{activity.title}</strong>
        </p>
      </div>

      {/* สถิติหลัก */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <span className="text-sm text-on-surface">คะแนนประเมินเฉลี่ย</span>
          <div className="text-3xl font-bold text-primary mt-1">{avgRating} / 5</div>
        </Card>
        <Card className="text-center">
          <span className="text-sm text-on-surface">จำนวนผู้ประเมิน</span>
          <div className="text-3xl font-bold text-on-surface mt-1">{evals.length} คน</div>
        </Card>
        <Card className="text-center">
          <span className="text-sm text-on-surface">จำนวนผู้เข้าร่วมทั้งหมด</span>
          <div className="text-3xl font-bold text-on-surface mt-1">{activity.currentParticipants} คน</div>
        </Card>
      </div>

      {/* คลังข้อเสนอแนะเพื่อการปรับปรุงครั้งถัดไป */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="info">จุดเด่น / สิ่งที่ผู้เข้าร่วมชอบ</Badge>
          </div>
          <ul className="space-y-2 text-sm text-on-surface divide-y divide-gray-100">
            {evals.map((e) => (
              <li key={e.id} className="pt-2">
                &bull; {e.liked || "-"}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="neutral">ข้อเสนอแนะเพื่อปรับปรุงครั้งถัดไป</Badge>
          </div>
          <ul className="space-y-2 text-sm text-on-surface divide-y divide-gray-100">
            {evals.map((e) => (
              <li key={e.id} className="pt-2 text-on-error-container">
                &bull; {e.improvement || "-"}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </section>
  );
}
