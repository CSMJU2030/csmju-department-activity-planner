/**
 * Fail fast on a misconfigured deployment instead of silently falling back to
 * development defaults in production.
 */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const isProduction = config.NODE_ENV === 'production';
  if (String(config.LOCAL_TEST_ROLE ?? '').trim()) {
    throw new Error('LOCAL_TEST_ROLE is no longer supported. Use Core Hub SSO.');
  }
  for (const [key, expected] of [['CORE_HUB_ISSUER', 'core-hub'], ['CORE_HUB_AUDIENCE', 'csmju2030']]) {
    if (config[key] !== undefined && config[key] !== expected) throw new Error(`${key} must be ${expected}`);
  }
  const tolerance = Number(config.JWT_CLOCK_TOLERANCE_SEC ?? 5);
  if (!Number.isFinite(tolerance) || tolerance < 0 || tolerance > 60) throw new Error('JWT clock tolerance must be 0–60 seconds');
  const id = String(config.SUBSYSTEM_ID ?? 'csmju-department-activity-planner');
  if (!/^[a-z][a-z0-9-]*$/.test(id) || id === 'csmju') throw new Error('Invalid SUBSYSTEM_ID');
  const required = isProduction
    ? ['DATABASE_URL', 'CORE_HUB_URL', 'CORE_HUB_ISSUER', 'CORE_HUB_AUDIENCE']
    : ['DATABASE_URL'];

  const missing = required.filter((key) => {
    const value = config[key];
    return value === undefined || value === null || String(value).trim() === '';
  });

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  for (const key of ['CORE_HUB_URL', 'CORE_HUB_WEB_URL', 'CORE_HUB_JWKS_URL']) {
    if (!config[key]) continue;
    const url = new URL(String(config[key]));
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
        (isProduction && url.protocol !== 'https:')) throw new Error(`${key} must be a valid ${isProduction ? 'HTTPS' : 'HTTP(S)'} URL`);
  }

  return config;
}
