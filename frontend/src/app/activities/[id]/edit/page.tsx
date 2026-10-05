import Link from "next/link";
import { redirect } from "next/navigation";
import { getActivity } from "@/lib/api";
import { getSession, unwrap } from "@/lib/session";
import { SignedOut } from "@/components/layout/SignedOut";
import { updateActivityAction } from "@/app/actions/activity";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { ActionForm } from "@/components/ui/ActionForm";

export default async function EditActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return <SignedOut />;
  const activity = unwrap(await getActivity(id));

  if (activity.createdBy !== session.me.id) {
    redirect(`/activities/${id}`);
  }

  const categoryOptions = [
    { value: "academic", label: "วิชาการ / สัมมนา" },
    { value: "workshop", label: "เวิร์กช็อปปฏิบัติการ" },
    { value: "recreation", label: "สันทนาการ / สานสัมพันธ์" },
  ];

  return (
    <section className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Link
          href={`/organizer/${activity.id}/manage`}
          className="text-sm text-primary hover:underline"
        >
          &larr; กลับหน้าจัดการกิจกรรม
        </Link>
        <Badge variant="info">Organizer Edit Mode</Badge>
      </div>

      <Card className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-primary">
            แก้ไขข้อมูลกิจกรรม
          </h1>
          <p className="text-sm text-on-surface">
            ปรับปรุงรายละเอียด กำหนดการ หรือจำนวนที่นั่งที่เปิดรับ
          </p>
        </div>

        <ActionForm
          action={async (formData: FormData) => {
            "use server";
            return updateActivityAction(formData);
          }}
          label="บันทึกการแก้ไข"
        >
          <input type="hidden" name="activityId" value={activity.id} />

          <Input
            id="title"
            name="title"
            label="ชื่อกิจกรรม"
            defaultValue={activity.title}
            required
          />

          <Select
            id="category"
            name="category"
            label="หมวดหมู่กิจกรรม"
            defaultValue={activity.category}
            options={categoryOptions}
          />

          <Input
            id="location"
            name="location"
            label="สถานที่จัดกิจกรรม"
            defaultValue={activity.location}
            required
          />

          <Input
            id="maxParticipants"
            name="maxParticipants"
            type="number"
            label="จำนวนผู้เข้าร่วมสูงสุด (คน)"
            defaultValue={activity.maxParticipants}
            min={Math.max(1, activity.currentParticipants)}
            step={1}
            required
          />

          <Textarea
            id="description"
            name="description"
            label="รายละเอียดกิจกรรม"
            defaultValue={activity.description}
            rows={4}
            required
          />

          <div className="flex gap-2 pt-3">
            <Link
              href={`/organizer/${activity.id}/manage`}
              className="flex-1 text-center"
            >
              <Button type="button" variant="outline" className="w-full py-2.5">
                ยกเลิก
              </Button>
            </Link>
          </div>
        </ActionForm>
      </Card>
    </section>
  );
}
