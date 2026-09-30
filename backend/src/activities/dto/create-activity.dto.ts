import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ACTIVITY_CATEGORIES } from '../activity.types';
import { IsInstant } from './iso-instant';
import { Trim, TrimLower } from './trim';

/**
 * Who is organising comes from the verified token, never from the body — the
 * ValidationPipe's forbidNonWhitelisted rejects a smuggled createdBy.
 */
export class CreateActivityDto {
  @Trim()
  @IsString()
  @Length(1, 150)
  title!: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @TrimLower()
  @IsIn(ACTIVITY_CATEGORIES)
  category!: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsInt()
  @Min(1)
  @Max(2147483647)
  maxParticipants!: number;

  /** ISO 8601 with a timezone, e.g. 2026-10-10T09:00:00+07:00 */
  @IsInstant()
  startAt!: string;

  @IsInstant()
  endAt!: string;
}
