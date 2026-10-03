import { INestApplication, RequestMethod, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { sessionCookieName, stateCookieName } from '../src/auth/sso-session';
import { PrismaService } from '../src/prisma/prisma.service';
import { FakeCoreHub } from './helpers/fake-core-hub';
import { InMemoryPrisma } from './helpers/in-memory-prisma';
import { createSigningKey, signCoreHubToken, tamperPayload, TestSigningKey } from './helpers/token-factory';

const ID = 'csmju-department-activity-planner';
const SESSION = sessionCookieName(ID);
const STATE = stateCookieName(ID);
const cookiesOf = (res: request.Response): string[] => {
  const value = res.headers['set-cookie'];
  return Array.isArray(value) ? value : value ? [String(value)] : [];
};
const sessionOf = (res: request.Response) => cookiesOf(res).find((cookie) => cookie.startsWith(`${SESSION}=`)) ?? '';

describe('Core Hub SSO contract 1.2 (e2e)', () => {
  let app: INestApplication;
  let hub: FakeCoreHub;
  let key: TestSigningKey;
  let token: string;
  beforeAll(async () => {
    key = await createSigningKey();
    hub = new FakeCoreHub();
    await hub.start([key]);
    process.env.CORE_HUB_URL = hub.url;
    process.env.CORE_HUB_WEB_URL = hub.url;
    process.env.CORE_HUB_JWKS_URL = hub.jwksUrl;
    delete process.env.LOCAL_TEST_ROLE;
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService).useValue(new InMemoryPrisma()).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api', { exclude: [
      { path: 'auth/login', method: RequestMethod.GET },
      { path: 'auth/callback', method: RequestMethod.GET },
      { path: 'auth/logout', method: RequestMethod.POST },
    ] });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    token = await signCoreHubToken(key, { sub: 'user-002', role: 'student', azp: ID });
  });
  afterAll(async () => { await app?.close(); await hub?.stop(); });

  async function begin(next = '/my-activities?tab=registrations') {
    const res = await request(app.getHttpServer()).get('/auth/login').query({ next }).expect(302);
    const url = new URL(res.headers.location);
    expect(url.origin).toBe(hub.url);
    expect(url.pathname).toBe('/sso/authorize');
    expect(url.searchParams.get('subsystem')).toBe(ID);
    expect(url.searchParams.has('callback_url')).toBe(false);
    expect(res.headers['cache-control']).toBe('no-store');
    return { state: url.searchParams.get('state')!, cookie: cookiesOf(res)[0] };
  }
  async function callback(value = token, next?: string) {
    const flow = await begin(next);
    return request(app.getHttpServer()).get('/auth/callback')
      .set('Cookie', flow.cookie).query({ access_token: value, state: flow.state });
  }

  it('binds callback to a random state, stores the verified token and returns to the requested page', async () => {
    const res = await callback();
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/my-activities?tab=registrations');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
    expect(sessionOf(res)).toContain('HttpOnly');
    expect(sessionOf(res)).toContain('SameSite=Lax');
    expect(sessionOf(res)).toContain('Path=/');
    expect(cookiesOf(res).find((cookie) => cookie.startsWith(`${STATE}=`))).toContain('Max-Age=0');
    const me = await request(app.getHttpServer()).get('/api/v1/me').set('Cookie', sessionOf(res)).expect(200);
    expect(me.body.data.id).toBe('user-002');
    expect(Date.parse(me.body.data.session.expiresAt)).toBeGreaterThan(Date.now());
  });

  it('discards a token arriving directly from the Core portal without modifying any cookies', async () => {
    const res = await request(app.getHttpServer()).get('/auth/callback').query({ access_token: token }).expect(302);
    expect(res.headers.location).toBe('/auth/login');
    expect(cookiesOf(res)).toEqual([]);
  });

  it('shows a retry page for expired/mismatched state without a redirect loop', async () => {
    const res = await request(app.getHttpServer()).get('/auth/callback')
      .set('Accept', 'text/html').query({ access_token: token, state: 'attacker' }).expect(401);
    expect(res.text).toContain('เข้าสู่ระบบอีกครั้ง');
    expect(sessionOf(res)).toBe('');
    expect(res.headers.location).toBeUndefined();
  });

  it('rejects a state that differs from the cookie', async () => {
    const flow = await begin();
    const res = await request(app.getHttpServer()).get('/auth/callback')
      .set('Cookie', flow.cookie).query({ access_token: token, state: 'mismatch' }).expect(401);
    expect(sessionOf(res)).toBe('');
  });

  it.each(['https://evil.example', '//evil.example', '/\\evil.example', '/auth/login', '/a/../auth/callback', '/bad\npath'])('rejects unsafe return path %j', async (next) => {
    const res = await callback(token, next);
    expect(res.headers.location).toBe('/');
  });

  it('rejects a missing token and clears a supplied state', async () => {
    const res = await request(app.getHttpServer()).get('/auth/callback').query({ state: 'nonce' }).expect(400);
    expect(sessionOf(res)).toBe('');
    expect(cookiesOf(res)[0]).toContain('Max-Age=0');
  });

  it('rejects tampered tokens without establishing a session', async () => {
    const res = await callback(tamperPayload(token, { role: 'admin' }));
    expect(res.status).toBe(401);
    expect(sessionOf(res)).toBe('');
  });

  it('rejects unsupported roles with 403', async () => {
    const res = await callback(await signCoreHubToken(key, { role: 'finance-officer' }));
    expect(res.status).toBe(403);
    expect(sessionOf(res)).toBe('');
  });

  it('still refuses activity creation for ordinary students', async () => {
    const res = await callback();
    await request(app.getHttpServer()).post('/api/v1/activities').set('Cookie', sessionOf(res))
      .send({ title: 'Workshop', category: 'workshop', maxParticipants: 30,
        startAt: '2026-10-10T09:00:00+07:00', endAt: '2026-10-10T12:00:00+07:00' }).expect(403);
  });

  it('returns JSON 401 for APIs rather than redirecting to Core', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/me').expect(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(res.headers.location).toBeUndefined();
    await request(app.getHttpServer()).get('/api/v1/me').set('Cookie', `${SESSION}=%E0%A4%A`).expect(401);
  });

  it('maps a configured verified staff identity to local ADMIN and allows Head management', async () => {
    const config = app.get(ConfigService);
    const previous = config.get<string[]>('localAdminCoreUserIds', []);
    config.set('localAdminCoreUserIds', ['local-admin-staff']);
    try {
      const localAdmin = await signCoreHubToken(key, { sub: 'local-admin-staff', role: 'staff', azp: ID });
      const me = await request(app.getHttpServer()).get('/api/v1/me').set('Authorization', `Bearer ${localAdmin}`).expect(200);
      expect(me.body.data).toMatchObject({ coreRole: 'staff', subsystemRole: 'ADMIN' });
      const path = '/api/v1/admin/activity-heads';
      await request(app.getHttpServer()).post(path).set('Authorization', `Bearer ${localAdmin}`).send({ coreUserId: 'local-head' }).expect(201);
      await request(app.getHttpServer()).delete(`${path}/local-head`).set('Authorization', `Bearer ${localAdmin}`).expect(200);
      config.set('localAdminCoreUserIds', []);
      await request(app.getHttpServer()).get(path).set('Authorization', `Bearer ${localAdmin}`).expect(403);
      const tampered = tamperPayload(token, { sub: 'local-admin-staff' });
      await request(app.getHttpServer()).get(path).set('Authorization', `Bearer ${tampered}`).expect(401);
    } finally {
      config.set('localAdminCoreUserIds', previous);
    }
  });

  it('allows Core admins to grant/revoke Head, and immediately changes student capabilities', async () => {
    const admin = await signCoreHubToken(key, { sub: 'admin-001', role: 'admin', azp: ID });
    const staff = await signCoreHubToken(key, { sub: 'staff-001', role: 'staff', azp: ID });
    const path = '/api/v1/admin/activity-heads';
    for (const caller of [token, staff]) {
      await request(app.getHttpServer()).post(path).set('Authorization', `Bearer ${caller}`).send({ coreUserId: 'user-002' }).expect(403);
      await request(app.getHttpServer()).get(path).set('Authorization', `Bearer ${caller}`).expect(403);
      await request(app.getHttpServer()).delete(`${path}/user-002`).set('Authorization', `Bearer ${caller}`).expect(403);
    }
    await request(app.getHttpServer()).post(path).set('Authorization', `Bearer ${admin}`).send({ coreUserId: 'user-002', role: 'admin' }).expect(400);
    await request(app.getHttpServer()).post(path).set('Authorization', `Bearer ${admin}`).send({ coreUserId: 'x'.repeat(65) }).expect(400);
    const grant = await request(app.getHttpServer()).post(path).set('Authorization', `Bearer ${admin}`).send({ coreUserId: 'user-002' }).expect(201);
    expect(grant.body.data).toMatchObject({ grantedBy: 'admin-001', active: true });
    let caps = await request(app.getHttpServer()).get('/api/v1/me/activity-capabilities').set('Authorization', `Bearer ${token}`).expect(200);
    expect(caps.body.data.canCreateActivity).toBe(true);
    const created = await request(app.getHttpServer()).post('/api/v1/activities').set('Authorization', `Bearer ${token}`)
      .send({ title: 'Head activity', category: 'workshop', maxParticipants: 1,
        startAt: '2026-10-10T09:00:00+07:00', endAt: '2026-10-10T12:00:00+07:00' }).expect(201);
    expect(created.body.data.createdBy).toBe('user-002');
    await request(app.getHttpServer()).delete(`${path}/user-002`).set('Authorization', `Bearer ${admin}`).expect(200);
    caps = await request(app.getHttpServer()).get('/api/v1/me/activity-capabilities').set('Authorization', `Bearer ${token}`).expect(200);
    expect(caps.body.data.canCreateActivity).toBe(false);
    const list = await request(app.getHttpServer()).get(path).set('Authorization', `Bearer ${admin}`).expect(200);
    expect(list.body.data[0]).toMatchObject({ active: false, revokedBy: 'admin-001' });
    await request(app.getHttpServer()).post('/api/v1/activities').set('Authorization', `Bearer ${token}`).send({ title: 'x', category: 'workshop', maxParticipants: 1,
      startAt: '2026-10-10T09:00:00+07:00', endAt: '2026-10-10T12:00:00+07:00' }).expect(403);
  });

  it('clears both cookies and sends logout to Core', async () => {
    const res = await request(app.getHttpServer()).post('/auth/logout').expect(303);
    expect(res.headers.location).toBe(`${hub.url}/logout`);
    expect(cookiesOf(res)).toHaveLength(2);
    expect(cookiesOf(res).every((cookie) => cookie.includes('Max-Age=0'))).toBe(true);
    expect(res.headers['cache-control']).toBe('no-store');
  });
});
