import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateVariantDto {
  @IsString()
  size!: string;

  @IsString()
  color!: string;

  @IsNumber()
  @Min(0)
  additionalPrice!: number;

  @IsNumber()
  @Min(0)
  stockQuantity!: number;

  @IsOptional()
  @IsString()
  sku?: string;
}