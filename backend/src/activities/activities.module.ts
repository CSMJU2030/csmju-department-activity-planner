import { Module } from '@nestjs/common';
import { ActivitiesController, ActivitiesMeController } from './activities.controller';
import { ActivitiesService } from './activities.service';

@Module({
  controllers: [ActivitiesController, ActivitiesMeController],
  providers: [ActivitiesService],
})
export class ActivitiesModule {}
