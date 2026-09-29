import 'reflect-metadata';
import { InjectionToken, Module, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { ActivitiesController, ActivitiesMeController } from '../activities/activities.controller';
import { ActivitiesService } from '../activities/activities.service';
import { AuthEventsLogger } from '../auth/auth-events.logger';
import { CoreHubTokenVerifier } from '../auth/core-hub-token.verifier';
import { MeController } from '../auth/me.controller';
import { SsoCallbackController } from '../auth/sso-callback.controller';
import { HealthController } from '../health/health.controller';

/**
 * Writes backend/openapi.json (tech-stack.md §3, rule API-01).
 *
 * It builds a documentation-only module out of the real controllers with empty
 * stand-ins for their services, so it needs no database and no Core Hub, and it
 * produces the same file on every run. The route prefix mirrors main.ts.
 *
 *   pnpm --filter backend generate:openapi
 */
const stub = (provide: InjectionToken) => ({ provide, useValue: {} });

@Module({
  controllers: [
    ActivitiesController,
    ActivitiesMeController,
    MeController,
    SsoCallbackController,
    HealthController,
  ],
  providers: [
    stub(ActivitiesService),
    stub(AuthEventsLogger),
    stub(CoreHubTokenVerifier),
    stub(ConfigService),
  ],
})
class OpenApiModule {}

async function main(): Promise<void> {
  const app = await NestFactory.create(OpenApiModule, { logger: false });
  app.setGlobalPrefix('api', { exclude: [{ path: 'auth/callback', method: RequestMethod.GET }] });

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Department Activity Planner API')
      .setDescription(
        'CSMJU2030 subsystem. Every success response is wrapped as { success, data[, meta] }; ' +
          'errors as { success: false, error: { code, message, details } }.',
      )
      .setVersion('1.0.0')
      .addBearerAuth()
      .build(),
  );

  writeFileSync(resolve(process.cwd(), 'openapi.json'), `${JSON.stringify(document, null, 2)}\n`);
  await app.close();
}

void main();
