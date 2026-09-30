import { CoreHubIdentity, SubsystemRole } from '../auth/core-hub-identity';

/**
 * TEMPORARY local test identity, carried over from the MIS project so the
 * activity system can be used before Core Hub is available.
 *
 *   LOCAL_TEST_ROLE=HEAD      -> the student class head (can create activities)
 *   LOCAL_TEST_ROLE=STUDENT   -> an ordinary student
 *   (unset)                   -> real Core Hub authentication (the default)
 *
 * The role is server configuration, never a header, cookie or form field.
 * It is refused outright when NODE_ENV=production. Remove this folder (and the
 * two lines in app.module.ts) once Core Hub login is connected.
 */
export const LOCAL_TEST_USERS = {
  HEAD: {
    id: 'local-head-001',
    email: 'หัวหน้าห้อง (ผู้ใช้ทดสอบ)',
    isClassHead: true,
  },
  STUDENT: {
    id: 'local-student-001',
    email: 'นักศึกษา (ผู้ใช้ทดสอบ)',
    isClassHead: false,
  },
} as const;

export type LocalTestRole = keyof typeof LOCAL_TEST_USERS;

/** The configured local identity, or null when real Core Hub authentication is in charge. */
export function readLocalTestRole(env: NodeJS.ProcessEnv = process.env): LocalTestRole | null {
  const raw = env.LOCAL_TEST_ROLE?.trim();
  if (!raw) {
    return null;
  }
  if (env.NODE_ENV === 'production') {
    throw new Error('LOCAL_TEST_ROLE must not be set in production');
  }
  const role = raw.toUpperCase();
  if (role !== 'HEAD' && role !== 'STUDENT') {
    throw new Error(`LOCAL_TEST_ROLE must be HEAD or STUDENT (got "${raw}")`);
  }
  return role;
}

export function localTestIdentity(role: LocalTestRole): CoreHubIdentity {
  const user = LOCAL_TEST_USERS[role];
  return {
    id: user.id,
    email: user.email,
    coreRole: 'student',
    subsystemRole: SubsystemRole.STUDENT,
  };
}

/** Core Hub user ids that count as class heads in the current mode. */
export function localClassHeadIds(env: NodeJS.ProcessEnv = process.env): string[] {
  return readLocalTestRole(env) === 'HEAD' ? [LOCAL_TEST_USERS.HEAD.id] : [];
}
