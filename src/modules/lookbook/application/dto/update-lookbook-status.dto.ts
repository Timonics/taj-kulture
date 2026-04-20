import { IsString, IsIn, IsOptional } from 'class-validator';

export class UpdateLookbookStatusDto {
  @IsString()
  @IsIn(['approved', 'rejected'])
  status!: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}