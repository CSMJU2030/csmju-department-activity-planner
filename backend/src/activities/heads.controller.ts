import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { AppException } from '../common/errors';
import { PrismaService } from '../prisma/prisma.service';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';

export class GrantHeadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^\S+$/)
  coreUserId!: string;
}

/** All endpoints also check the verified Core role; no client role is trusted. */
@Controller('v1/admin/activity-heads')
@RequirePermissions(Permission.ACTIVITY_HEAD_MANAGE)
export class HeadsController {
  constructor(private readonly prisma: PrismaService) {}
  private requireAdmin(user: CoreHubIdentity): void {
    if (user.coreRole !== 'admin') throw AppException.forbidden('เฉพาะผู้ดูแลระบบเท่านั้นที่จัดการสิทธิ์ Head ได้');
  }

  @Get()
  list(@CurrentUser() user: CoreHubIdentity) {
    this.requireAdmin(user);
    return this.prisma.activityHead.findMany({ orderBy: { grantedAt: 'desc' } });
  }

  @Post()
  grant(@CurrentUser() user: CoreHubIdentity, @Body() dto: GrantHeadDto) {
    this.requireAdmin(user);
    const data = { active: true, grantedBy: user.id, grantedAt: new Date(), revokedBy: null, revokedAt: null };
    return this.prisma.activityHead.upsert({ where: { coreUserId: dto.coreUserId },
      create: { coreUserId: dto.coreUserId, ...data }, update: data });
  }

  @Delete(':coreUserId')
  async revoke(@CurrentUser() user: CoreHubIdentity, @Param('coreUserId') coreUserId: string) {
    this.requireAdmin(user);
    const result = await this.prisma.activityHead.updateMany({ where: { coreUserId, active: true },
      data: { active: false, revokedBy: user.id, revokedAt: new Date() } });
    if (!result.count) throw AppException.notFound('ไม่พบสิทธิ์ Head ที่เปิดใช้งานของผู้ใช้นี้');
    return { coreUserId, active: false };
  }
}
