import { SubsystemRole } from './core-hub-identity';

/**
 * Subsystem permissions (spec §16).
 *
 *   Core JWT -> Core Role -> Subsystem Role -> Permission -> Business Operation
 *
 * Business code asks for a permission, never for `role === 'admin'`.
 * `:own` variants are scope hints: the guard lets the request through and the
 * service performs the ownership check against business data.
 */
export enum Permission {
  /** Appoint/revoke local Head permission; only Core admins. */
  ACTIVITY_HEAD_MANAGE = 'activity:head:manage',
  /** Browse activities, roles and one's own participation. */
  ACTIVITY_READ = 'activity:read',
  /** Register, cancel, apply for a team role, evaluate. */
  ACTIVITY_PARTICIPATE = 'activity:participate',
  /** Create an activity (students also require active Head permission). */
  ACTIVITY_CREATE = 'activity:create',
  /** Edit, change status, manage roles/applications of one's own activity. */
  ACTIVITY_MANAGE_OWN = 'activity:manage:own',
}

/** Students browse, take part, and (as class head) organise activities. */
const STUDENT_PERMISSIONS: Permission[] = [
  Permission.ACTIVITY_READ,
  Permission.ACTIVITY_PARTICIPATE,
  Permission.ACTIVITY_CREATE,
  Permission.ACTIVITY_MANAGE_OWN,
];

/** Alumni may look at activities but not take part. */
const ALUMNI_PERMISSIONS: Permission[] = [Permission.ACTIVITY_READ];

/** Faculty/staff browse, take part, and organise their own activities. */
const STAFF_PERMISSIONS: Permission[] = [
  Permission.ACTIVITY_READ,
  Permission.ACTIVITY_PARTICIPATE,
  Permission.ACTIVITY_CREATE,
  Permission.ACTIVITY_MANAGE_OWN,
];

const ADMIN_PERMISSIONS: Permission[] = Object.values(Permission);

export const ROLE_PERMISSIONS: Readonly<Record<SubsystemRole, readonly Permission[]>> =
  Object.freeze({
    [SubsystemRole.STUDENT]: Object.freeze(STUDENT_PERMISSIONS),
    [SubsystemRole.ALUMNI]: Object.freeze(ALUMNI_PERMISSIONS),
    [SubsystemRole.STAFF]: Object.freeze(STAFF_PERMISSIONS),
    [SubsystemRole.ADMIN]: Object.freeze(ADMIN_PERMISSIONS),
  });

/** Does this subsystem role hold the given permission? */
export function can(role: SubsystemRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Does this subsystem role hold at least one of the given permissions? */
export function canAny(role: SubsystemRole, permissions: readonly Permission[]): boolean {
  return permissions.some((permission) => can(role, permission));
}
