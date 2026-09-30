import React from "react";
import { submitEvaluationAction } from "@/app/actions/activity";
import { Card } from "@/components/ui/Card";
import { ActionForm } from "@/components/ui/ActionForm";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

export const EvaluationForm: React.FC<{ activityId: string }> = ({
  activityId,
}) => {
  const ratingOptions = [
    { value: "5", label: "5 - ยอดเยี่ยมมาก" },
    { value: "4", label: "4 - ดีมาก" },
    { value: "3", label: "3 - ปานกลาง" },
    { value: "2", label: "2 - พอใช้" },
    { value: "1", label: "1 - ต้องปรับปรุง" },
  ];

  return (
    <Card className="space-y-4 border-primary/20 bg-blue-50/20">
      <div>
        <h3 className="text-base font-bold text-primary">
          แบบประเมินผลกิจกรรม
        </h3>
        <p className="text-sm leading-[1.6] text-neutral">
          ความคิดเห็นของคุณจะถูกนำไปพัฒนาและปรับปรุงกิจกรรมในครั้งต่อไป
        </p>
      </div>

      <ActionForm action={submitEvaluationAction} label="ส่งแบบประเมิน">
        <input type="hidden" name="activityId" value={activityId} />

        <Select
          id="rating"
          name="rating"
          label="ระดับความพึงพอใจโดยรวม"
          options={ratingOptions}
          required
        />

        <Textarea
          id="liked"
          name="liked"
          maxLength={2000}
          label="สิ่งที่ประทับใจ / จุดเด่นของกิจกรรม"
          placeholder="เช่น วิทยากรอธิบายเข้าใจง่าย ได้ลงมือทำจริง..."
          required
        />

        <Textarea
          id="improvement"
          name="improvement"
          maxLength={2000}
          label="ข้อเสนอแนะสำหรับการจัดกิจกรรมครั้งถัดไป"
          placeholder="เช่น อยากให้เพิ่มเวลาช่วงปฏิบัติการ..."
          required
        />

      </ActionForm>
    </Card>
  );
};
