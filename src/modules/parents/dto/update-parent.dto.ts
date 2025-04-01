import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { EmergencyContactDto } from './emergency-contact.dto';

class PersonalInfoUpdateDto {
  @ApiProperty({
    example: 'John',
    description: 'First name of the parent',
    required: false,
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    example: 'Smith',
    description: 'Last name of the parent',
    required: false,
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    example: 'Software Engineer',
    description: 'Occupation of the parent',
    required: false,
  })
  @IsString()
  @IsOptional()
  occupation?: string;

  @ApiProperty({
    example: 'john.smith',
    description: 'Username for login',
    required: false,
  })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({
    example: 'newSecurePassword123',
    description: 'New password for login',
    required: false,
  })
  @IsString()
  @IsOptional()
  password?: string;
}

class ContactInfoUpdateDto {
  @ApiProperty({
    example: 'john.smith@example.com',
    description: 'Email address of the parent',
    required: false,
  })
  @IsString()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: '(555) 123-4567',
    description: 'Phone number of the parent',
    required: false,
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    example: '123 Main Street',
    description: 'Street address',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    example: 'New York',
    description: 'City',
    required: false,
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    example: 'NY',
    description: 'State/Province',
    required: false,
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({
    example: '10001',
    description: 'Zip/Postal code',
    required: false,
  })
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiProperty({
    example: 'USA',
    description: 'Country',
    required: false,
  })
  @IsString()
  @IsOptional()
  country?: string;
}

export class UpdateParentDto {
  @ApiProperty({
    type: PersonalInfoUpdateDto,
    description: 'Personal information of the parent',
    required: false,
  })
  @ValidateNested()
  @Type(() => PersonalInfoUpdateDto)
  @IsOptional()
  personal?: PersonalInfoUpdateDto;

  @ApiProperty({
    type: ContactInfoUpdateDto,
    description: 'Contact information of the parent',
    required: false,
  })
  @ValidateNested()
  @Type(() => ContactInfoUpdateDto)
  @IsOptional()
  contact?: ContactInfoUpdateDto;

  @ApiProperty({
    type: [EmergencyContactDto],
    description:
      'List of emergency contacts (if provided, at least one is required)',
    required: false,
    minItems: 1,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmergencyContactDto)
  @IsOptional()
  @ArrayMinSize(1, {
    message:
      'At least one emergency contact is required when updating contacts',
  })
  emergencyContacts?: EmergencyContactDto[];

  @ApiProperty({
    example: 'Parent prefers to be contacted via email. Works evening shifts.',
    description: 'Additional notes about the parent',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
