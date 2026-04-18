import { IsEmail, IsPhoneNumber, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsPhoneNumber('NG')
  phone!: string;

  @IsString()
  @MinLength(2)
  fullName!: string;
}