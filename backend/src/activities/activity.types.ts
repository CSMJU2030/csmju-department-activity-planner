import type { ActivityStatus } from '../../generated/prisma/client';

/** An activity as the API returns it: the stored row plus the live seat count. */
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

export const ACTIVITY_CATEGORIES = [
  'workshop',
  'seminar',
  'competition',
  'volunteer',
  'recreation',
  'academic',
  'other',
] as const;

/** Statuses an organiser may set by hand (DRAFT is not selectable). */
export const SETTABLE_STATUSES = ['OPEN', 'FULL', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
