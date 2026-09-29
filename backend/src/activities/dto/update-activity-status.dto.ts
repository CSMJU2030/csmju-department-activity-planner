import { IsIn } from 'class-validator';
import { SETTABLE_STATUSES } from '../activity.types';

export class UpdateActivityStatusDto {
  @IsIn(SETTABLE_STATUSES)
  status!: (typeof SETTABLE_STATUSES)[number];
}
