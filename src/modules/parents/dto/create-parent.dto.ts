import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { EmergencyContactDto } from './emergency-contact.dto';

class PersonalInfoDto {
  @ApiProperty({
    example: 'John',
    description: 'First name of the parent',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    example: 'Smith',
    description: 'Last name of the parent',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: 'Software Engineer',
    description: 'Occupation of the parent',
    required: false,
  })
  @IsString()
  @IsOptional()
  occupation?: string;
}

class ContactInfoDto {
  @ApiProperty({
    example: 'john.smith@example.com',
    description: 'Email address of the parent',
  })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '(555) 123-4567',
    description: 'Phone number of the parent',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    example: '123 Main Street',
    description: 'Street address',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    example: 'New York',
    description: 'City',
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    example: 'NY',
    description: 'State/Province',
  })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({
    example: '10001',
    description: 'Zip/Postal code',
  })
  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @ApiProperty({
    example: 'USA',
    description: 'Country',
  })
  @IsString()
  @IsNotEmpty()
  country: string;
}

export class CreateParentDto {
  @ApiProperty({
    type: PersonalInfoDto,
    description: 'Personal information of the parent',
  })
  @ValidateNested()
  @Type(() => PersonalInfoDto)
  personal: PersonalInfoDto;

  @ApiProperty({
    type: ContactInfoDto,
    description: 'Contact information of the parent',
  })
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contact: ContactInfoDto;

  @ApiProperty({
    type: [EmergencyContactDto],
    description: 'List of emergency contacts (at least one required)',
    minItems: 1,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmergencyContactDto)
  @ArrayMinSize(1, { message: 'At least one emergency contact is required' })
  emergencyContacts: EmergencyContactDto[];

  @ApiProperty({
    example: 'Parent prefers to be contacted via email. Works evening shifts.',
    description: 'Additional notes about the parent',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
