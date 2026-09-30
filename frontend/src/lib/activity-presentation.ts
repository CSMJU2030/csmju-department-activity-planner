import type { ActivityStatus, ApplicationStatus } from "@/types/activity";
export const activityStatusLabels: Record<ActivityStatus, string> = {
  DRAFT: "ฉบับร่าง", OPEN: "เปิดรับสมัคร", FULL: "ที่นั่งเต็ม",
  IN_PROGRESS: "กำลังจัดกิจกรรม", COMPLETED: "สิ้นสุดแล้ว", CANCELLED: "ยกเลิกกิจกรรม",
};
export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  PENDING: "รอพิจารณา", ACCEPTED: "ผ่านการคัดเลือก", REJECTED: "ไม่ผ่านการคัดเลือก",
};
export const categoryLabels: Record<string, string> = {
  academic: "วิชาการ", workshop: "เวิร์กช็อป", recreation: "สันทนาการ",
};
export function formatActivityDate(value: string) {
  // Mock timestamps without offsets represent Thai local time.
  const date = new Date(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value) ? value + "+07:00" : value);
  return Number.isNaN(date.getTime()) ? "ยังไม่ระบุเวลา" : new Intl.DateTimeFormat("th-TH", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok",
  }).format(date);
}
