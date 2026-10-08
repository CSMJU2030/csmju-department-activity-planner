import { Injectable } from '@nestjs/common';
import type { Activity, ActivityStatus, Prisma } from '../../generated/prisma/client';
import { CoreHubIdentity, SubsystemRole } from '../auth/core-hub-identity';
import { AppException } from '../common/errors';
import { PrismaService } from '../prisma/prisma.service';
import type { ActivityItem } from './activity.types';
import { CreateActivityRoleDto } from './dto/create-activity-role.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

const counts = { _count: { select: { registrations: true } } } as const;
type ActivityWithCount = Activity & { _count: { registrations: number } };

function present(a: ActivityWithCount): ActivityItem {
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    category: a.category,
    startAt: a.startAt.toISOString(),
    endAt: a.endAt.toISOString(),
    location: a.location,
    maxParticipants: a.maxParticipants,
    currentParticipants: a._count.registrations,
    status: a.status,
    createdBy: a.createdBy,
    creatorName: a.creatorName,
    createdAt: a.createdAt.toISOString(),
  };
}

/** The Core Hub token carries no display name, so the e-mail identifies people on screen. */
const displayName = (user: CoreHubIdentity) => user.email || user.id;

function requireOwner(a: Activity, user: CoreHubIdentity): void {
  if (a.createdBy !== user.id) throw AppException.forbidden('คุณไม่มีสิทธิ์จัดการกิจกรรมนี้');
}

function requireOpen(a: Activity): void {
  if (a.status !== 'OPEN' && a.status !== 'FULL') {
    throw AppException.conflict('กิจกรรมนี้ปิดรับสมัครแล้ว');
  }
}

const activityNotFound = () => AppException.notFound('ไม่พบกิจกรรมนี้ในระบบ');

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Staff and students with active Head permission may create activities. Heads are
   * local database permissions granted by a verified Core admin.
   */
  async canCreateActivity(user: CoreHubIdentity): Promise<boolean> {
    if (user.subsystemRole === SubsystemRole.STAFF) return true;
    if (user.subsystemRole !== SubsystemRole.STUDENT) return false;
    const head = await this.prisma.activityHead.findUnique({ where: { coreUserId: user.id } });
    return head?.active === true;
  }

  /**
   * Every mutation of an existing activity locks the same row before checking
   * quotas. This works across concurrent requests and multiple server processes.
   */
  private locked<T>(
    id: string,
    work: (tx: Prisma.TransactionClient, a: ActivityWithCount) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "activity_activities" WHERE "id" = ${id} FOR UPDATE`;
        const activity = await tx.activity.findUnique({ where: { id }, include: counts });
        if (!activity) throw activityNotFound();
        return work(tx, activity);
      },
      { isolationLevel: 'ReadCommitted', maxWait: 10000, timeout: 15000 },
    );
  }

  async list(skip: number, take: number): Promise<{ items: ActivityItem[]; total: number }> {
    const [rows, total] = await Promise.all([
      this.prisma.activity.findMany({
        include: counts,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip,
        take,
      }),
      this.prisma.activity.count(),
    ]);
    return { items: rows.map(present), total };
  }

  async findOne(id: string): Promise<ActivityItem> {
    const a = await this.prisma.activity.findUnique({ where: { id }, include: counts });
    if (!a) throw activityNotFound();
    return present(a);
  }

  async listRoles(activityId: string) {
    await this.findOne(activityId);
    const roles = await this.prisma.activityRole.findMany({
      where: { activityId },
      include: { _count: { select: { applications: { where: { status: 'ACCEPTED' } } } } },
      orderBy: { roleName: 'asc' },
    });
    return roles.map((r) => ({
      id: r.id,
      activityId: r.activityId,
      roleName: r.roleName,
      description: r.description,
      maxMembers: r.maxMembers,
      currentMembers: r._count.applications,
    }));
  }

  /** Organiser only: who applied for the team and their status. */
  async listApplications(user: CoreHubIdentity, activityId: string) {
    requireOwner(await this.loadActivity(activityId), user);
    return this.prisma.teamApplication.findMany({
      where: { activityId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Organiser only: the evaluations submitted for the activity. */
  async listEvaluations(user: CoreHubIdentity, activityId: string) {
    requireOwner(await this.loadActivity(activityId), user);
    return this.prisma.evaluation.findMany({
      where: { activityId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async participation(user: CoreHubIdentity, activityId: string) {
    await this.findOne(activityId);
    const where = { activityId_coreUserId: { activityId, coreUserId: user.id } };
    const [myApplication, registration, evaluation] = await Promise.all([
      this.prisma.teamApplication.findUnique({ where }),
      this.prisma.registration.findUnique({ where }),
      this.prisma.evaluation.findUnique({ where, select: { id: true } }),
    ]);
    return { myApplication, isRegistered: !!registration, hasEvaluated: !!evaluation };
  }

  async myActivities(user: CoreHubIdentity) {
    const coreUserId = user.id;
    const [created, registrations, applications] = await Promise.all([
      this.prisma.activity.findMany({
        where: { createdBy: coreUserId },
        include: counts,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.registration.findMany({
        where: { coreUserId },
        include: { activity: { include: counts } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.teamApplication.findMany({
        where: { coreUserId },
        include: { activity: true, role: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return {
      created: created.map(present),
      registrations: registrations.map((r) => ({ ...r, activity: present(r.activity) })),
      applications,
    };
  }

  /** Activities I organise, each with the people who registered. */
  async organizedActivities(user: CoreHubIdentity) {
    const activities = await this.prisma.activity.findMany({
      where: { createdBy: user.id },
      include: { registrations: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return activities.map((a) => ({
      id: a.id,
      title: a.title,
      category: a.category,
      startAt: a.startAt.toISOString(),
      endAt: a.endAt.toISOString(),
      location: a.location,
      maxParticipants: a.maxParticipants,
      status: a.status,
      registrations: a.registrations.map((r) => ({
        id: r.id,
        coreUserId: r.coreUserId,
        createdAt: r.createdAt.toISOString(),
      })),
    }));
  }

  async create(user: CoreHubIdentity, dto: CreateActivityDto): Promise<ActivityItem> {
    if (!(await this.canCreateActivity(user))) {
      throw AppException.forbidden('เฉพาะเจ้าหน้าที่ อาจารย์ หรือนักศึกษาที่เป็นหัวหน้าห้องเท่านั้นที่สร้างกิจกรรมได้');
    }
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (endAt.getTime() <= startAt.getTime()) {
      throw AppException.badRequest('เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น');
    }
    const created = await this.prisma.activity.create({
      data: {
        title: dto.title,
        description: dto.description ?? '',
        category: dto.category,
        location: dto.location ?? '',
        maxParticipants: dto.maxParticipants,
        startAt,
        endAt,
        createdBy: user.id,
        creatorName: displayName(user),
      },
      include: counts,
    });
    return present(created);
  }

  update(id: string, user: CoreHubIdentity, dto: UpdateActivityDto): Promise<ActivityItem> {
    return this.locked(id, async (tx, a) => {
      requireOwner(a, user);
      const maxParticipants = dto.maxParticipants ?? a.maxParticipants;
      if (maxParticipants < a._count.registrations) {
        throw AppException.conflict('จำนวนที่เปิดรับต้องไม่น้อยกว่าผู้ที่ลงทะเบียนแล้ว');
      }
      const startAt = dto.startAt ? new Date(dto.startAt) : a.startAt;
      const endAt = dto.endAt ? new Date(dto.endAt) : a.endAt;
      if (endAt.getTime() <= startAt.getTime()) {
        throw AppException.badRequest('เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น');
      }
      const status: ActivityStatus = ['OPEN', 'FULL'].includes(a.status)
        ? a._count.registrations >= maxParticipants
          ? 'FULL'
          : 'OPEN'
        : a.status;
      const updated = await tx.activity.update({
        where: { id },
        data: {
          title: dto.title,
          description: dto.description,
          category: dto.category,
          location: dto.location,
          maxParticipants,
          startAt,
          endAt,
          status,
        },
        include: counts,
      });
      return present(updated);
    });
  }

  setStatus(id: string, status: ActivityStatus, user: CoreHubIdentity): Promise<ActivityItem> {
    return this.locked(id, async (tx, a) => {
      requireOwner(a, user);
      const full = a._count.registrations >= a.maxParticipants;
      if (status === 'FULL' && !full) {
        throw AppException.conflict('ยังมีที่นั่งว่าง ไม่สามารถกำหนดสถานะที่นั่งเต็ม');
      }
      const updated = await tx.activity.update({
        where: { id },
        data: { status: status === 'OPEN' && full ? 'FULL' : status },
        include: counts,
      });
      return present(updated);
    });
  }

  createRole(id: string, user: CoreHubIdentity, dto: CreateActivityRoleDto) {
    return this.locked(id, async (tx, a) => {
      requireOwner(a, user);
      requireOpen(a);
      const nameKey = dto.roleName.toLowerCase();
      const existing = await tx.activityRole.findUnique({
        where: { activityId_nameKey: { activityId: id, nameKey } },
      });
      if (existing) throw AppException.conflict('มีตำแหน่งชื่อนี้ในกิจกรรมแล้ว');
      return tx.activityRole.create({
        data: {
          roleName: dto.roleName,
          description: dto.description ?? '',
          maxMembers: dto.maxMembers,
          nameKey,
          activityId: id,
        },
      });
    });
  }

  register(id: string, user: CoreHubIdentity) {
    return this.locked(id, async (tx, a) => {
      const where = { activityId_coreUserId: { activityId: id, coreUserId: user.id } };
      if (await tx.registration.findUnique({ where })) {
        throw AppException.conflict('คุณลงทะเบียนกิจกรรมนี้แล้ว');
      }
      requireOpen(a);
      if (a.status === 'FULL' || a._count.registrations >= a.maxParticipants) {
        throw AppException.conflict('ที่นั่งสำหรับกิจกรรมนี้เต็มแล้ว');
      }
      const registration = await tx.registration.create({
        data: { activityId: id, coreUserId: user.id },
      });
      if (a._count.registrations + 1 === a.maxParticipants) {
        await tx.activity.update({ where: { id }, data: { status: 'FULL' } });
      }
      return registration;
    });
  }

  cancelRegistration(id: string, user: CoreHubIdentity) {
    return this.locked(id, async (tx, a) => {
      requireOpen(a);
      const where = { activityId_coreUserId: { activityId: id, coreUserId: user.id } };
      const registration = await tx.registration.findUnique({ where });
      if (!registration) throw AppException.notFound('ไม่พบการลงทะเบียนของคุณในกิจกรรมนี้');
      await tx.registration.delete({ where });
      if (a.status === 'FULL') await tx.activity.update({ where: { id }, data: { status: 'OPEN' } });
      return { id: registration.id, deleted: true };
    });
  }

  applyForRole(id: string, roleId: string, user: CoreHubIdentity) {
    return this.locked(id, async (tx, a) => {
      requireOpen(a);
      const role = await tx.activityRole.findFirst({ where: { id: roleId, activityId: id } });
      if (!role) throw AppException.notFound('ไม่พบตำแหน่งทีมงานในกิจกรรมนี้');
      const existing = await tx.teamApplication.findUnique({
        where: { activityId_coreUserId: { activityId: id, coreUserId: user.id } },
      });
      if (existing) throw AppException.conflict('คุณได้ส่งใบสมัครทีมงานในกิจกรรมนี้แล้ว');
      return tx.teamApplication.create({
        data: { activityId: id, roleId, coreUserId: user.id, userName: displayName(user) },
      });
    });
  }

  respond(
    id: string,
    applicationId: string,
    status: 'ACCEPTED' | 'REJECTED',
    user: CoreHubIdentity,
  ) {
    return this.locked(id, async (tx, a) => {
      requireOwner(a, user);
      requireOpen(a);
      const application = await tx.teamApplication.findFirst({
        where: { id: applicationId, activityId: id },
        include: { role: true },
      });
      if (!application) throw AppException.notFound('ไม่พบใบสมัครนี้');
      if (application.status !== 'PENDING') {
        throw AppException.conflict('ใบสมัครนี้ได้รับการพิจารณาแล้ว');
      }
      const accepted = await tx.teamApplication.count({
        where: { roleId: application.roleId, status: 'ACCEPTED' },
      });
      if (status === 'ACCEPTED' && accepted >= application.role.maxMembers) {
        throw AppException.conflict('ตำแหน่งนี้มีทีมงานครบตามจำนวนแล้ว');
      }
      return tx.teamApplication.update({ where: { id: applicationId }, data: { status } });
    });
  }

  evaluate(id: string, user: CoreHubIdentity, dto: CreateEvaluationDto) {
    return this.locked(id, async (tx, a) => {
      if (a.status !== 'COMPLETED') {
        throw AppException.conflict('ประเมินได้เมื่อกิจกรรมสิ้นสุดแล้วเท่านั้น');
      }
      const where = { activityId_coreUserId: { activityId: id, coreUserId: user.id } };
      if (!(await tx.registration.findUnique({ where }))) {
        throw AppException.forbidden('เฉพาะผู้ที่ลงทะเบียนเข้าร่วมกิจกรรมนี้เท่านั้นที่ประเมินได้');
      }
      if (await tx.evaluation.findUnique({ where })) {
        throw AppException.conflict('คุณได้ส่งแบบประเมินกิจกรรมนี้แล้ว');
      }
      return tx.evaluation.create({
        data: {
          rating: dto.rating,
          liked: dto.liked,
          improvement: dto.improvement,
          activityId: id,
          coreUserId: user.id,
        },
      });
    });
  }

  private async loadActivity(id: string): Promise<Activity> {
    const a = await this.prisma.activity.findUnique({ where: { id } });
    if (!a) throw activityNotFound();
    return a;
  }
}
