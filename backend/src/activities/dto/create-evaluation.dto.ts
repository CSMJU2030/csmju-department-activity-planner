import { IsInt, IsString, Length, Max, Min } from 'class-validator';
import { Trim } from './trim';

export class CreateEvaluationDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @Trim()
  @IsString()
  @Length(1, 2000)
  liked!: string;

  @Trim()
  @IsString()
  @Length(1, 2000)
  improvement!: string;
}
