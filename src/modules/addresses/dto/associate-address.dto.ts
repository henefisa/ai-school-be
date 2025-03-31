import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class AssociateAddressDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Entity ID to associate with the address',
  })
  @IsUUID(4)
  @IsNotEmpty()
  entityId: string;

  @ApiProperty({
    example: 'Primary',
    description: 'Type of address (e.g., Primary, Secondary, Work)',
    required: false,
  })
  @IsOptional()
  @IsString()
  addressType?: string;
}
