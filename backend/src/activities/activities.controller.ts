import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import { CollectionResult } from '../common/api-response';
import { PaginationQueryDto, buildPaginationMeta } from '../common/dto/pagination.dto';
import { ActivitiesService } from './activities.service';
import { CreateActivityRoleDto } from './dto/create-activity-role.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { RespondApplicationDto } from './dto/respond-application.dto';
import { UpdateActivityStatusDto } from './dto/update-activity-status.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Controller('v1/activities')
export class ActivitiesController {
  constructor(private readonly activities: ActivitiesService) {}

  @Get()
  @RequirePermissions(Permission.ACTIVITY_READ)
  async findAll(@Query() query: PaginationQueryDto) {
    const { items, total } = await this.activities.list(query.skip, query.take);
    return new CollectionResult(items, buildPaginationMeta(total, query.page ?? 1, query.take));
  }

  @Get(':id')
  @RequirePermissions(Permission.ACTIVITY_READ)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.activities.findOne(id);
  }

  @Post()
  @RequirePermissions(Permission.ACTIVITY_CREATE)
  create(@CurrentUser() user: CoreHubIdentity, @Body() dto: CreateActivityDto) {
    return this.activities.create(user, dto);
  }

  @Patch(':id')
  @RequirePermissions(Permission.ACTIVITY_MANAGE_OWN)
  update(
    @CurrentUser() user: CoreHubIdentity,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.activities.update(id, user, dto);
  }

  @Patch(':id/status')
  @RequirePermissions(Permission.ACTIVITY_MANAGE_OWN)
  setStatus(
    @CurrentUser() user: CoreHubIdentity,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateActivityStatusDto,
  ) {
    return this.activities.setStatus(id, dto.status, user);
  }

  // ----- team roles -------------------------------------------------------

  @Get(':id/roles')
  @RequirePermissions(Permission.ACTIVITY_READ)
  roles(@Param('id', ParseUUIDPipe) id: string) {
    return this.activities.listRoles(id);
  }

  @Post(':id/roles')
  @RequirePermissions(Permission.ACTIVITY_MANAGE_OWN)
  createRole(
    @CurrentUser() user: CoreHubIdentity,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateActivityRoleDto,
  ) {
    return this.activities.createRole(id, user, dto);
  }

  @Post(':id/roles/:roleId/applications')
  @RequirePermissions(Permission.ACTIVITY_PARTICIPATE)
  apply(
    @CurrentUser() user: CoreHubIdentity,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ) {
    return this.activities.applyForRole(id, roleId, user);
  }

  @Get(':id/applications')
  @RequirePermissions(Permission.ACTIVITY_MANAGE_OWN)
  applications(@CurrentUser() user: CoreHubIdentity, @Param('id', ParseUUIDPipe) id: string) {
    return this.activities.listApplications(user, id);
  }

  @Patch(':id/applications/:applicationId')
  @RequirePermissions(Permission.ACTIVITY_MANAGE_OWN)
  respond(
    @CurrentUser() user: CoreHubIdentity,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: RespondApplicationDto,
  ) {
    return this.activities.respond(id, applicationId, dto.status, user);
  }

  // ----- registration -----------------------------------------------------

  @Post(':id/registrations')
  @RequirePermissions(Permission.ACTIVITY_PARTICIPATE)
  register(@CurrentUser() user: CoreHubIdentity, @Param('id', ParseUUIDPipe) id: string) {
    return this.activities.register(id, user);
  }

  /** Cancels the caller's own registration (`me` is the caller, not an id). */
  @Delete(':id/registrations/me')
  @RequirePermissions(Permission.ACTIVITY_PARTICIPATE)
  cancelRegistration(@CurrentUser() user: CoreHubIdentity, @Param('id', ParseUUIDPipe) id: string) {
    return this.activities.cancelRegistration(id, user);
  }

  @Get(':id/participation')
  @RequirePermissions(Permission.ACTIVITY_READ)
  participation(@CurrentUser() user: CoreHubIdentity, @Param('id', ParseUUIDPipe) id: string) {
    return this.activities.participation(user, id);
  }

  // ----- evaluation -------------------------------------------------------

  @Get(':id/evaluations')
  @RequirePermissions(Permission.ACTIVITY_MANAGE_OWN)
  evaluations(@CurrentUser() user: CoreHubIdentity, @Param('id', ParseUUIDPipe) id: string) {
    return this.activities.listEvaluations(user, id);
  }

  @Post(':id/evaluations')
  @RequirePermissions(Permission.ACTIVITY_PARTICIPATE)
  evaluate(
    @CurrentUser() user: CoreHubIdentity,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateEvaluationDto,
  ) {
    return this.activities.evaluate(id, user, dto);
  }
}

/** The signed-in user's own view of the activity system (`/api/v1/me/...`). */
@Controller('v1/me')
export class ActivitiesMeController {
  constructor(private readonly activities: ActivitiesService) {}

  @Get('activities')
  @RequirePermissions(Permission.ACTIVITY_READ)
  mine(@CurrentUser() user: CoreHubIdentity) {
    return this.activities.myActivities(user);
  }

  @Get('organized-activities')
  @RequirePermissions(Permission.ACTIVITY_READ)
  organized(@CurrentUser() user: CoreHubIdentity) {
    return this.activities.organizedActivities(user);
  }

  /** What the UI may offer this user (the API enforces it regardless). */
  @Get('activity-capabilities')
  @RequirePermissions(Permission.ACTIVITY_READ)
  async capabilities(@CurrentUser() user: CoreHubIdentity) {
    return { canCreateActivity: await this.activities.canCreateActivity(user) };
  }
}
