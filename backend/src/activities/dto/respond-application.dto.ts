import { IsIn } from 'class-validator';

export class RespondApplicationDto {
  @IsIn(['ACCEPTED', 'REJECTED'])
  status!: 'ACCEPTED' | 'REJECTED';
}
