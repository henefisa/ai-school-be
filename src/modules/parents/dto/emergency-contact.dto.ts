import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EmergencyContactDto {
  @ApiProperty({
    example: 'Jane Smith',
    description: 'Full name of the emergency contact',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Sister',
    description: 'Relationship to the parent',
  })
  @IsString()
  @IsNotEmpty()
  relationship: string;

  @ApiProperty({
    example: '(555) 123-4567',
    description: 'Phone number of the emergency contact',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    example: 'jane.smith@example.com',
    description: 'Email address of the emergency contact',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  @IsString()
  email?: string;
}
