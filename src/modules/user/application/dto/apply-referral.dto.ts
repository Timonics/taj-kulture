import { IsString, IsNotEmpty } from 'class-validator';

export class ApplyReferralDto {
  @IsString()
  @IsNotEmpty()
  referralCode!: string;
}
