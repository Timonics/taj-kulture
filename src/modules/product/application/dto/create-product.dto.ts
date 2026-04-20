import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsDateString, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  basePrice!: number;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  collection?: string;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsBoolean()
  isLimitedDrop?: boolean;

  @IsOptional()
  @IsDateString()
  dropStartTime?: string;

  @IsOptional()
  @IsDateString()
  dropEndTime?: string;
}