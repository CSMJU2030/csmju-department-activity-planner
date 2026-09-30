import { ExecutionContext } from '@nestjs/common';
import { SubsystemRole } from '../auth/core-hub-identity';
import { localClassHeadIds, localTestIdentity, readLocalTestRole } from './local-auth';
import { LocalIdentityGuard } from './local-identity.guard';

describe('temporary local test identity', () => {
  const env = (values: Record<string, string | undefined>) => values as NodeJS.ProcessEnv;

  it('is off unless LOCAL_TEST_ROLE is set (real Core Hub authentication is the default)', () => {
    expect(readLocalTestRole(env({}))).toBeNull();
    expect(readLocalTestRole(env({ LOCAL_TEST_ROLE: '  ' }))).toBeNull();
    expect(localClassHeadIds(env({}))).toEqual([]);
  });

  it('accepts HEAD and STUDENT in any case', () => {
    expect(readLocalTestRole(env({ LOCAL_TEST_ROLE: 'head' }))).toBe('HEAD');
    expect(readLocalTestRole(env({ LOCAL_TEST_ROLE: 'STUDENT' }))).toBe('STUDENT');
  });

  it('refuses to run in production', () => {
    expect(() => readLocalTestRole(env({ LOCAL_TEST_ROLE: 'HEAD', NODE_ENV: 'production' }))).toThrow(
      /production/,
    );
  });

  it('rejects an unknown role instead of guessing', () => {
    expect(() => readLocalTestRole(env({ LOCAL_TEST_ROLE: 'ADMIN' }))).toThrow(/HEAD or STUDENT/);
  });

  it('makes only the HEAD user a class head', () => {
    expect(localClassHeadIds(env({ LOCAL_TEST_ROLE: 'HEAD' }))).toEqual(['local-head-001']);
    expect(localClassHeadIds(env({ LOCAL_TEST_ROLE: 'STUDENT' }))).toEqual([]);
    expect(localTestIdentity('HEAD').subsystemRole).toBe(SubsystemRole.STUDENT);
    expect(localTestIdentity('STUDENT').id).toBe('local-student-001');
  });

  describe('LocalIdentityGuard', () => {
    const previous = { role: process.env.LOCAL_TEST_ROLE, nodeEnv: process.env.NODE_ENV };
    afterEach(() => {
      const restore = (key: string, value: string | undefined) =>
        value === undefined ? delete process.env[key] : (process.env[key] = value);
      restore('LOCAL_TEST_ROLE', previous.role);
      restore('NODE_ENV', previous.nodeEnv);
    });

    it('attaches the configured user and ignores anything the client sends', () => {
      process.env.LOCAL_TEST_ROLE = 'STUDENT';
      const request: Record<string, unknown> = {
        headers: { authorization: 'Bearer forged', 'x-user': 'local-head-001' },
      };
      const context = { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;

      expect(new LocalIdentityGuard().canActivate(context)).toBe(true);
      expect(request.user).toMatchObject({ id: 'local-student-001', subsystemRole: SubsystemRole.STUDENT });
    });

    it('cannot be constructed without the setting, or in production', () => {
      delete process.env.LOCAL_TEST_ROLE;
      expect(() => new LocalIdentityGuard()).toThrow();
      process.env.LOCAL_TEST_ROLE = 'HEAD';
      process.env.NODE_ENV = 'production';
      expect(() => new LocalIdentityGuard()).toThrow(/production/);
    });
  });
});
