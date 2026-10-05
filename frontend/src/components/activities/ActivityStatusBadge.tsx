import { StatusBadge, type StatusTone } from "@/csmju";
import { activityStatusLabels } from "@/lib/activity-presentation";
import type { ActivityStatus } from "@/types/activity";

const tones: Record<ActivityStatus, StatusTone> = {
  DRAFT: "neutral", OPEN: "info", FULL: "warning", IN_PROGRESS: "info", COMPLETED: "success", CANCELLED: "neutral",
};

export function ActivityStatusBadge({ status }: { status: ActivityStatus }) {
  return <StatusBadge tone={tones[status]} label={activityStatusLabels[status]} />;
}
