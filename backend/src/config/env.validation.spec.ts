import { validateEnv } from './env.validation';

describe('Core deployment configuration', () => {
  const base = { DATABASE_URL: 'postgresql://localhost/test' };
  it('rejects the retired mock identity switch', () => {
    expect(() => validateEnv({ ...base, LOCAL_TEST_ROLE: 'HEAD' })).toThrow(/no longer supported/);
  });
  it.each([
    { CORE_HUB_AUDIENCE: 'wrong' }, { CORE_HUB_ISSUER: 'wrong' },
    { JWT_CLOCK_TOLERANCE_SEC: 61 }, { SUBSYSTEM_ID: 'csmju' },
  ])('fails closed on invalid contract settings %j', (settings) => {
    expect(() => validateEnv({ ...base, ...settings })).toThrow();
  });
  it('rejects insecure Core URLs in production', () => {
    expect(() => validateEnv({ ...base, NODE_ENV: 'production', CORE_HUB_ISSUER: 'core-hub',
      CORE_HUB_AUDIENCE: 'csmju2030', CORE_HUB_URL: 'http://core.test' })).toThrow(/HTTPS/);
  });
});
