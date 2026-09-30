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

/** PATCH body: send only the fields to change. Same limits as creation. */
export class UpdateActivityDto {
  @IsOptional()
  @Trim()
  @IsString()
  @Length(1, 150)
  title?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @TrimLower()
  @IsIn(ACTIVITY_CATEGORIES)
  category?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2147483647)
  maxParticipants?: number;

  @IsOptional()
  @IsInstant()
  startAt?: string;

  @IsOptional()
  @IsInstant()
  endAt?: string;
}
