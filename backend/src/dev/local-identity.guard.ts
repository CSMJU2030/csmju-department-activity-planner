import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { LocalTestRole, localTestIdentity, readLocalTestRole } from './local-auth';

/**
 * Stands in for CoreHubJwtGuard while LOCAL_TEST_ROLE is set: every request is
 * the configured local test user. It ignores every header and cookie, so a
 * client cannot pick another identity. See local-auth.ts for how to remove it.
 */
@Injectable()
export class LocalIdentityGuard implements CanActivate {
  private readonly role: LocalTestRole;

  constructor() {
    const role = readLocalTestRole();
    if (!role) {
      throw new Error('LocalIdentityGuard needs LOCAL_TEST_ROLE');
    }
    this.role = role;
    new Logger('LocalIdentity').warn(
      `LOCAL_TEST_ROLE=${role}: every request runs as the local test user. Not real authentication - never use in production.`,
    );
  }

  canActivate(context: ExecutionContext): boolean {
    context.switchToHttp().getRequest<Request & { user?: CoreHubIdentity }>().user =
      localTestIdentity(this.role);
    return true;
  }
}
