export type ActivityStatus =
  | "DRAFT"
  | "OPEN"
  | "FULL"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type ApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface ActivityRole {
  id: string;
  activityId: string;
  roleName: string;
  description?: string;
  maxMembers: number;
  currentMembers?: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  category: string;
  startAt: string;
  endAt: string;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  status: ActivityStatus;
  createdBy: string;
  creatorName: string;
  createdAt: string;
}