import { IsString, IsOptional, IsArray, IsUrl } from 'class-validator';

export class CreateLookbookPostDto {
  @IsUrl()
  imageUrl!: string;  // from Cloudinary upload

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  taggedProductIds?: string[];

  @IsOptional()
  @IsString()
  caption?: string;
}