import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({
    example: 'Apt 4B',
    description: 'Steet Address',
    required: true,
  })
  @IsString()
  street: string;

  @ApiProperty({
    example: 'New York',
    description: 'City',
    required: true,
  })
  @IsString()
  city: string;

  @ApiProperty({
    example: 'NY',
    description: 'State/Province',
    required: true,
  })
  @IsString()
  state: string;

  @ApiProperty({
    example: '10001',
    description: 'Zip/Postal Code',
    required: true,
  })
  @IsString()
  zipCode: string;

  @ApiProperty({
    example: 'USA',
    description: 'Country',
    required: true,
  })
  @IsString()
  country: string;
}
