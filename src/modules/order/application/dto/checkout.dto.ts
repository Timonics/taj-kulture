import { ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class ShippingAddressDto {
  @IsString() street!: string;
  @IsString() city!: string;
  @IsString() state!: string;
  @IsString() zipCode!: string;
  @IsString() phone!: string;
}

export class CheckoutDto {
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress!: ShippingAddressDto;
}
