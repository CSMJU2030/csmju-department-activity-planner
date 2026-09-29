import { IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';
import { Trim } from './trim';

export class CreateActivityRoleDto {
  @Trim()
  @IsString()
  @Length(1, 100)
  roleName!: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsInt()
  @Min(1)
  @Max(100)
  maxMembers!: number;
}
