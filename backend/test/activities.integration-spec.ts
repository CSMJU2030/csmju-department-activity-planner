/**
 * Integration test against a REAL PostgreSQL database (ported from the MIS
 * project's database.test.ts). It proves what the in-memory doubles cannot:
 * row locking, uniqueness and cascade behaviour.
 *
 * It is skipped unless DATABASE_URL points at a LOCAL database that already has
 * the migrations applied:
 *
 *   docker compose up -d csmju-department-activity-planner-db
 *   pnpm --filter backend prisma:deploy
 *   DATABASE_URL=... pnpm --filter backend test:integration
 *
 * It only ever deletes the exact rows it created.
 */
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { CoreHubIdentity, SubsystemRole } from '../src/auth/core-hub-identity';
import { ActivitiesService } from '../src/activities/activities.service';
import { PrismaService } from '../src/prisma/prisma.service';

const url = process.env.DATABASE_URL;
const isLocal = !!url && ['127.0.0.1', 'localhost', '[::1]'].includes(new URL(url).hostname);
const suite = isLocal ? describe : describe.skip;

const prefix = `test-${randomUUID()}`;
const head: CoreHubIdentity = {
  id: `${prefix}-head`,
  email: 'head@core.local',
  coreRole: 'student',
  subsystemRole: SubsystemRole.STUDENT,
};
const student = (name: string): CoreHubIdentity => ({ ...head, id: `${prefix}-${name}` });
const input = {
  title: '[automated test]',
  description: 'Temporary test record',
  category: 'workshop',
  location: 'Test',
  maxParticipants: 1,
  startAt: '2026-10-10T09:00:00+07:00',
  endAt: '2026-10-10T12:00:00+07:00',
};

suite('ActivitiesService against PostgreSQL', () => {
  let prisma: PrismaService;
  let service: ActivitiesService;
  const ids: string[] = [];

  const activity = async (capacity = 1) => {
    const created = await service.create(head, { ...input, maxParticipants: capacity });
    ids.push(created.id);
    return created;
  };

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    const config = { get: () => [head.id] } as unknown as ConfigService;
    service = new ActivitiesService(prisma, config);
  });

  afterAll(async () => {
    // Only delete exact records created by this run, never user-created rows.
    await prisma.activity.deleteMany({ where: { id: { in: ids }, createdBy: head.id } });
    await prisma.$disconnect();
  });

  it('only class heads create activities', async () => {
    await expect(service.create(student('a'), input)).rejects.toMatchObject({ status: 403 });
  });

  it('stores the schedule in UTC', async () => {
    const a = await activity();
    expect(a.startAt).toBe('2026-10-10T02:00:00.000Z');
    expect(a.endAt).toBe('2026-10-10T05:00:00.000Z');
  });

  it('simultaneous registrations cannot overbook; cancelling reopens and allows re-registering', async () => {
    const a = await activity();
    const users = [student('alice'), student('bob')];
    const results = await Promise.allSettled(users.map((u) => service.register(a.id, u)));
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const winner = users[results.findIndex((r) => r.status === 'fulfilled')];
    const loser = users[results.findIndex((r) => r.status === 'rejected')];

    expect((await service.findOne(a.id)).currentParticipants).toBe(1);
    expect((await service.findOne(a.id)).status).toBe('FULL');
    await expect(service.cancelRegistration(a.id, loser)).rejects.toMatchObject({ status: 404 });
    await service.cancelRegistration(a.id, winner);
    expect((await service.findOne(a.id)).status).toBe('OPEN');
    await service.register(a.id, loser);
  });

  it('duplicate concurrent submissions create one registration', async () => {
    const a = await activity(3);
    const u = student('dup');
    const results = await Promise.allSettled([service.register(a.id, u), service.register(a.id, u)]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect((await service.findOne(a.id)).currentParticipants).toBe(1);
  });

  it('team roles: unique names, capacity, one application per person, decisions are final', async () => {
    const a = await activity(5);
    const role = await service.createRole(a.id, head, { roleName: 'Host', maxMembers: 1 });
    await expect(service.createRole(a.id, head, { roleName: ' host ', maxMembers: 1 })).rejects.toMatchObject({ status: 409 });
    await expect(service.createRole(a.id, student('x'), { roleName: 'Other', maxMembers: 1 })).rejects.toMatchObject({ status: 403 });

    const first = await service.applyForRole(a.id, role.id, student('m1'));
    const second = await service.applyForRole(a.id, role.id, student('m2'));
    await expect(service.applyForRole(a.id, role.id, student('m1'))).rejects.toMatchObject({ status: 409 });

    await service.respond(a.id, first.id, 'ACCEPTED', head);
    await expect(service.respond(a.id, first.id, 'REJECTED', head)).rejects.toMatchObject({ status: 409 });
    await expect(service.respond(a.id, second.id, 'ACCEPTED', head)).rejects.toMatchObject({ status: 409 });
    expect((await service.listRoles(a.id))[0].currentMembers).toBe(1);
  });

  it('evaluation: COMPLETED only, registered participants only, once each', async () => {
    const a = await activity(2);
    const u = student('eval');
    const dto = { rating: 4, liked: 'good', improvement: 'more time' };
    await service.register(a.id, u);
    await expect(service.evaluate(a.id, u, dto)).rejects.toMatchObject({ status: 409 });

    await service.setStatus(a.id, 'COMPLETED', head);
    await expect(service.evaluate(a.id, student('stranger'), dto)).rejects.toMatchObject({ status: 403 });
    await service.evaluate(a.id, u, dto);
    await expect(service.evaluate(a.id, u, dto)).rejects.toMatchObject({ status: 409 });
    expect((await service.participation(u, a.id)).hasEvaluated).toBe(true);
  });

  it('the database itself rejects invalid capacity, dates, scores and duplicate registrations', async () => {
    const a = await activity(2);
    await expect(prisma.activity.update({ where: { id: a.id }, data: { maxParticipants: 0 } })).rejects.toBeDefined();
    await expect(prisma.activity.update({ where: { id: a.id }, data: { endAt: new Date(a.startAt) } })).rejects.toBeDefined();
    await expect(
      prisma.evaluation.create({ data: { activityId: a.id, coreUserId: student('x').id, rating: 6, liked: 'a', improvement: 'b' } }),
    ).rejects.toBeDefined();
    await prisma.registration.create({ data: { activityId: a.id, coreUserId: student('a').id } });
    await expect(
      prisma.registration.create({ data: { activityId: a.id, coreUserId: student('a').id } }),
    ).rejects.toBeDefined();
  });
});
