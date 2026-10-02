import { Module } from '@nestjs/common';
import { ActivitiesController, ActivitiesMeController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { HeadsController } from './heads.controller';

@Module({
  controllers: [ActivitiesController, ActivitiesMeController, HeadsController],
  providers: [ActivitiesService],
})
export class ActivitiesModule {}
