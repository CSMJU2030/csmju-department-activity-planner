import { CoreHubIdentity, SubsystemRole } from '../auth/core-hub-identity';
import { PrismaService } from '../prisma/prisma.service';
import { ActivitiesService } from './activities.service';

const HEAD_ID = 'head-001';
const ACTIVITY_ID = '11111111-1111-4111-8111-111111111111';

const identity = (id: string, subsystemRole = SubsystemRole.STUDENT): CoreHubIdentity => ({
  id,
  email: `${id}@core.local`,
  coreRole: subsystemRole.toLowerCase(),
  subsystemRole,
});

type Row = Record<string, unknown>;

/**
 * A tiny in-memory Prisma double covering the query shapes the service uses in
 * a transaction. Row locking and real concurrency are exercised by the
 * PostgreSQL integration suite (test/activities.integration-spec.ts).
 */
function fakePrisma(activity: Row, seats: string[] = []) {
  const state = { activity: { ...activity }, registrations: seats.map((coreUserId) => ({ id: `r-${coreUserId}`, coreUserId })), evaluations: [] as string[] };
  const withCount = () => ({ ...state.activity, _count: { registrations: state.registrations.length } });
  const tx = {
    $queryRaw: async () => [],
    activity: {
      findUnique: async () => withCount(),
      update: async ({ data }: { data: Row }) => {
        Object.assign(state.activity, data);
        return withCount();
      },
    },
    registration: {
      findUnique: async ({ where }: { where: { activityId_coreUserId: { coreUserId: string } } }) =>
        state.registrations.find((r) => r.coreUserId === where.activityId_coreUserId.coreUserId) ?? null,
      create: async ({ data }: { data: { coreUserId: string } }) => {
        const row = { id: `r-${data.coreUserId}`, coreUserId: data.coreUserId };
        state.registrations.push(row);
        return row;
      },
      delete: async ({ where }: { where: { activityId_coreUserId: { coreUserId: string } } }) => {
        state.registrations = state.registrations.filter(
          (r) => r.coreUserId !== where.activityId_coreUserId.coreUserId,
        );
      },
    },
    activityRole: {
      findUnique: async () => null,
      create: async ({ data }: { data: Row }) => ({ id: 'role-1', ...data }),
    },
    evaluation: {
      findUnique: async ({ where }: { where: { activityId_coreUserId: { coreUserId: string } } }) =>
        state.evaluations.includes(where.activityId_coreUserId.coreUserId) ? { id: 'e-1' } : null,
      create: async ({ data }: { data: { coreUserId: string } }) => {
        state.evaluations.push(data.coreUserId);
        return { id: 'e-1', ...data };
      },
    },
  };
  const prisma = { $transaction: async (work: (t: typeof tx) => unknown) => work(tx) } as unknown as PrismaService;
  return { prisma, state };
}

const baseActivity = (overrides: Row = {}): Row => ({
  id: ACTIVITY_ID,
  title: 'Workshop',
  description: '',
  category: 'workshop',
  startAt: new Date('2026-10-10T02:00:00Z'),
  endAt: new Date('2026-10-10T05:00:00Z'),
  location: 'CS201',
  maxParticipants: 1,
  status: 'OPEN',
  createdBy: HEAD_ID,
  creatorName: 'head',
  createdAt: new Date('2026-09-01T00:00:00Z'),
  ...overrides,
});

const service = (prisma: PrismaService, heads: string[] = [HEAD_ID]) => {
  Object.assign(prisma, { activityHead: { findUnique: async ({ where }: { where: { coreUserId: string } }) =>
    heads.includes(where.coreUserId) ? { active: true } : null } });
  return new ActivitiesService(prisma);
};

describe('ActivitiesService business rules', () => {
  it('allows staff and student heads while denying ordinary students', async () => {
    const { prisma } = fakePrisma(baseActivity());
    const svc = service(prisma);
    expect(await svc.canCreateActivity(identity(HEAD_ID))).toBe(true);
    expect(await svc.canCreateActivity(identity('someone-else'))).toBe(false);
    expect(await svc.canCreateActivity(identity('staff-without-head', SubsystemRole.STAFF))).toBe(true);
    expect(await svc.canCreateActivity(identity(HEAD_ID, SubsystemRole.ALUMNI))).toBe(false);
    await expect(
      svc.create(identity('someone-else'), {
        title: 'x',
        category: 'workshop',
        maxParticipants: 1,
        startAt: '2026-10-10T09:00:00+07:00',
        endAt: '2026-10-10T12:00:00+07:00',
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('marks the activity FULL when the last seat is taken and reopens it on cancellation', async () => {
    const { prisma, state } = fakePrisma(baseActivity());
    const svc = service(prisma);

    await svc.register(ACTIVITY_ID, identity('alice'));
    expect(state.activity.status).toBe('FULL');

    await expect(svc.register(ACTIVITY_ID, identity('bob'))).rejects.toMatchObject({
      status: 409,
      response: expect.objectContaining({ message: 'ที่นั่งสำหรับกิจกรรมนี้เต็มแล้ว' }),
    });

    await expect(svc.cancelRegistration(ACTIVITY_ID, identity('bob'))).rejects.toMatchObject({
      status: 404,
    });
    await expect(svc.cancelRegistration(ACTIVITY_ID, identity('alice'))).resolves.toMatchObject({
      deleted: true,
    });
    expect(state.activity.status).toBe('OPEN');
  });

  it('rejects a second registration by the same person', async () => {
    const { prisma } = fakePrisma(baseActivity({ maxParticipants: 3 }), ['alice']);
    await expect(service(prisma).register(ACTIVITY_ID, identity('alice'))).rejects.toMatchObject({
      status: 409,
    });
  });

  it('refuses registration once the activity is no longer open', async () => {
    const { prisma } = fakePrisma(baseActivity({ status: 'COMPLETED' }));
    await expect(service(prisma).register(ACTIVITY_ID, identity('alice'))).rejects.toMatchObject({
      status: 409,
    });
  });

  it('only the organiser may add team roles or change the status', async () => {
    const { prisma } = fakePrisma(baseActivity());
    const svc = service(prisma);
    await expect(
      svc.createRole(ACTIVITY_ID, identity('intruder'), { roleName: 'Host', maxMembers: 2 }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(svc.setStatus(ACTIVITY_ID, 'CANCELLED', identity('intruder'))).rejects.toMatchObject({
      status: 403,
    });
    await expect(
      svc.createRole(ACTIVITY_ID, identity(HEAD_ID), { roleName: 'Host', maxMembers: 2 }),
    ).resolves.toMatchObject({ nameKey: 'host' });
  });

  it('rejects FULL while seats remain and turns OPEN into FULL when no seat is left', async () => {
    const { prisma, state } = fakePrisma(baseActivity({ maxParticipants: 2 }), ['alice']);
    const svc = service(prisma);
    await expect(svc.setStatus(ACTIVITY_ID, 'FULL', identity(HEAD_ID))).rejects.toMatchObject({
      status: 409,
    });

    const full = fakePrisma(baseActivity({ maxParticipants: 1, status: 'CANCELLED' }), ['alice']);
    await service(full.prisma).setStatus(ACTIVITY_ID, 'OPEN', identity(HEAD_ID));
    expect(full.state.activity.status).toBe('FULL');
    expect(state.activity.status).toBe('OPEN');
  });

  it('shrinking the capacity below the registered count is refused', async () => {
    const { prisma } = fakePrisma(baseActivity({ maxParticipants: 3 }), ['alice', 'bob']);
    await expect(
      service(prisma).update(ACTIVITY_ID, identity(HEAD_ID), { maxParticipants: 1 }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('keeps the stored schedule when an edit sends no times', async () => {
    const { prisma, state } = fakePrisma(baseActivity({ maxParticipants: 3 }));
    await service(prisma).update(ACTIVITY_ID, identity(HEAD_ID), { title: 'Renamed' });
    expect((state.activity.startAt as Date).toISOString()).toBe('2026-10-10T02:00:00.000Z');
    expect((state.activity.endAt as Date).toISOString()).toBe('2026-10-10T05:00:00.000Z');
    expect(state.activity.title).toBe('Renamed');
  });

  it('evaluation needs a COMPLETED activity, a registration, and only one submission', async () => {
    const dto = { rating: 5, liked: 'good', improvement: 'more time' };

    const open = fakePrisma(baseActivity(), ['alice']);
    await expect(service(open.prisma).evaluate(ACTIVITY_ID, identity('alice'), dto)).rejects.toMatchObject({
      status: 409,
    });

    const done = fakePrisma(baseActivity({ status: 'COMPLETED' }), ['alice']);
    const svc = service(done.prisma);
    await expect(svc.evaluate(ACTIVITY_ID, identity('bob'), dto)).rejects.toMatchObject({ status: 403 });
    await expect(svc.evaluate(ACTIVITY_ID, identity('alice'), dto)).resolves.toMatchObject({
      coreUserId: 'alice',
    });
    await expect(svc.evaluate(ACTIVITY_ID, identity('alice'), dto)).rejects.toMatchObject({
      status: 409,
    });
  });
});
