import { Controller, Get, Headers, Post, Query, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { ApiHeader, ApiQuery, ApiResponse } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AppException } from '../common/errors';
import { AuthEventsLogger } from './auth-events.logger';
import { TokenRejectionReason, TokenVerificationError } from './auth.errors';
import { CoreHubTokenVerifier } from './core-hub-token.verifier';
import { Public } from './decorators/public.decorator';
import { mapCoreRoleToSubsystemRole } from './role-mapping';
import { buildCookie, matchingState, readCookie, safeNext, sessionCookieName, stateCookieName } from './sso-session';

/** Redirect-only SSO endpoints; credentials and token issuance belong to Core Hub. */
@Public()
@Controller('auth')
export class SsoCallbackController {
  constructor(private readonly verifier: CoreHubTokenVerifier,
    private readonly authEvents: AuthEventsLogger, private readonly config: ConfigService) {}

  private get id(): string { return this.config.get<string>('subsystemId', 'csmju-department-activity-planner'); }
  private get secure(): boolean { return this.config.get<string>('nodeEnv') === 'production'; }
  private get coreWeb(): string { return this.config.get<string>('coreHub.webUrl', 'https://csmju2030.jowave.com'); }

  @Get('login')
  @ApiQuery({ name: 'next', required: false, type: String, description: 'Local path to return to after SSO (1–512 characters)' })
  @ApiResponse({ status: 302, description: 'Redirect to Core Hub with state cookie' })
  login(@Query('next') next: unknown, @Res() response: Response): void {
    response.setHeader('Cache-Control', 'no-store');
    const state = randomBytes(32).toString('base64url');
    response.setHeader('Set-Cookie', buildCookie(stateCookieName(this.id),
      `${state}.${Buffer.from(safeNext(next)).toString('base64url')}`, '/auth/callback', 600, this.secure));
    const url = new URL('/sso/authorize', this.coreWeb);
    url.searchParams.set('subsystem', this.id);
    url.searchParams.set('state', state);
    response.redirect(302, url.toString());
  }

  @Post('logout')
  @ApiResponse({ status: 303, description: 'Clear subsystem cookies and redirect to Core Hub logout' })
  logout(@Res() response: Response): void {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Set-Cookie', [
      buildCookie(sessionCookieName(this.id), '', '/', 0, this.secure),
      buildCookie(stateCookieName(this.id), '', '/auth/callback', 0, this.secure),
    ]);
    response.redirect(303, new URL('/logout', this.coreWeb).toString());
  }

  @Get('callback')
  @ApiQuery({ name: 'access_token', required: true, type: String })
  @ApiQuery({ name: 'state', required: false, type: String })
  @ApiQuery({ name: 'token_type', required: false, enum: ['Bearer', 'bearer'] })
  @ApiQuery({ name: 'expires_in', required: false, type: String })
  @ApiHeader({ name: 'accept', required: false })
  @ApiResponse({ status: 302, description: 'Verified SSO session or restart of portal handoff' })
  @ApiResponse({ status: 400, description: 'Invalid callback parameters' })
  @ApiResponse({ status: 401, description: 'Invalid state or token; HTML retry page for state errors' })
  @ApiResponse({ status: 403, description: 'Core role is not supported' })
  async callback(@Query() query: Record<string, unknown>, @Req() request: Request,
    @Res() response: Response, @Headers('accept') accept?: string) {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Referrer-Policy', 'no-referrer');
    if (query.state !== undefined) {
      response.setHeader('Set-Cookie', buildCookie(stateCookieName(this.id), '', '/auth/callback', 0, this.secure));
    }
    if (typeof query.access_token !== 'string' || !query.access_token) throw AppException.badRequest('Missing Core Hub access token');
    if (query.state === undefined) { response.redirect(302, '/auth/login'); return; }
    const stored = readCookie(request.headers.cookie, stateCookieName(this.id));
    const [expected, encodedNext] = (stored ?? '').split('.');
    if (typeof query.state !== 'string' || query.state.length > 512 || !expected || !encodedNext || !matchingState(query.state, expected)) {
      if (accept?.includes('text/html')) {
        response.status(401).type('html').send('<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>เข้าสู่ระบบอีกครั้ง</title><main style="font:16px/1.8 sans-serif;color:#334155;max-width:640px;margin:64px auto;padding:24px"><h1>การเข้าสู่ระบบหมดเวลาหรือไม่ถูกต้อง</h1><p>กรุณาเริ่มเข้าสู่ระบบอีกครั้งผ่าน CSMJU2030</p><a style="color:#004C99" href="/auth/login">เข้าสู่ระบบอีกครั้ง</a></main></html>');
        return;
      }
      throw AppException.unauthorized('Invalid or expired SSO state');
    }
    if (Object.keys(query).some((name) => !['access_token', 'state', 'token_type', 'expires_in'].includes(name))) {
      throw AppException.badRequest('Unknown SSO callback parameter');
    }
    if ((query.token_type !== undefined && !['Bearer', 'bearer'].includes(String(query.token_type))) ||
        (query.expires_in !== undefined && (typeof query.expires_in !== 'string' || query.expires_in.length > 32))) {
      throw AppException.badRequest('Invalid SSO callback parameters');
    }
    let payload;
    try { payload = await this.verifier.verify(query.access_token); }
    catch (error) {
      this.authEvents.jwtRejected({ path: '/auth/callback',
        reason: error instanceof TokenVerificationError ? error.reason : TokenRejectionReason.MALFORMED_TOKEN,
        kid: error instanceof TokenVerificationError ? error.kid : undefined });
      throw AppException.unauthorized('The Core Hub SSO token could not be verified');
    }
    const subsystemRole = mapCoreRoleToSubsystemRole(payload.role);
    if (!subsystemRole) throw AppException.forbidden('Your Core Hub role has no access to this subsystem');
    response.append('Set-Cookie', buildCookie(sessionCookieName(this.id), query.access_token,
      '/', payload.exp! - Math.floor(Date.now() / 1000), this.secure));
    this.authEvents.jwtVerified({ sub: payload.sub, coreRole: payload.role, subsystemRole });
    response.redirect(302, safeNext(Buffer.from(encodedNext, 'base64url').toString('utf8')));
  }
}
