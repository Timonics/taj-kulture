import { IsPhoneNumber, IsString, Length, IsOptional, IsEmail, MinLength } from 'class-validator';

export class VerifyOtpDto {
  @IsPhoneNumber('NG')
  phone!: string;

  @IsString()
  @Length(6, 6)
  otp!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;
}