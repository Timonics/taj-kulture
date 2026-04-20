import { IsString, IsInt, IsOptional, IsUrl, Min, Max, ValidateIf } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsUrl()
  audioUrl?: string | null;

  @ValidateIf(o => !o.comment && !o.audioUrl)
  error?: string; // custom validation: at least one of comment or audioUrl required
}