import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Gender, Title, EmploymentType } from 'src/shared/constants';

export class UpdateTeacherDto {
  // Personal Info
  @ApiProperty({
    enum: Title,
    enumName: 'Title',
    example: Title.Mr,
    description: 'Teacher title',
    required: false,
  })
  @IsEnum(Title)
  @IsOptional()
  'personal.title'?: Title;

  @ApiProperty({
    description: 'Employee ID',
    example: 'EMP2024001',
    required: false,
  })
  @IsString()
  @IsOptional()
  'personal.employeeId'?: string;

  @ApiProperty({
    description: 'Teacher first name',
    example: 'John',
    required: false,
  })
  @IsString()
  @IsOptional()
  'personal.firstName'?: string;

  @ApiProperty({
    description: 'Teacher last name',
    example: 'Smith',
    required: false,
  })
  @IsString()
  @IsOptional()
  'personal.lastName'?: string;

  @ApiProperty({
    description: 'Date of birth (YYYY-MM-DD format)',
    example: '1980-05-15',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsDateString()
  'personal.dob'?: string;

  @ApiProperty({
    enum: Gender,
    enumName: 'Gender',
    example: Gender.Male,
    required: false,
  })
  @IsEnum(Gender)
  @IsOptional()
  'personal.gender'?: Gender;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Teacher photo (JPG, JPEG, or PNG)',
  })
  @IsOptional()
  'personal.photo'?: Express.Multer.File;

  @ApiProperty({
    description: 'Username for teacher account',
    example: 'john.smith',
    required: false,
  })
  @IsString()
  @IsOptional()
  'personal.username'?: string;

  @ApiProperty({
    description: 'Password for teacher account',
    example: 'Secure@Password123',
    required: false,
  })
  @IsString()
  @IsOptional()
  'personal.password'?: string;

  // Contact Info
  @ApiProperty({
    description: 'Street address',
    example: '123 Main Street',
  })
  @IsString()
  @IsOptional()
  'contact.street'?: string;

  @ApiProperty({
    description: 'City',
    example: 'Boston',
    required: false,
  })
  @IsString()
  @IsOptional()
  'contact.city'?: string;

  @ApiProperty({
    description: 'State/Province',
    example: 'Massachusetts',
    required: false,
  })
  @IsString()
  @IsOptional()
  'contact.state'?: string;

  @ApiProperty({
    description: 'Zip/Postal code',
    example: '02108',
    required: false,
  })
  @IsString()
  @IsOptional()
  'contact.zipCode'?: string;

  @ApiProperty({
    description: 'Country',
    example: 'United States',
    required: false,
  })
  @IsString()
  @IsOptional()
  'contact.country'?: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john.smith@example.com',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsEmail()
  'contact.email'?: string;

  @ApiProperty({
    description: 'Phone number',
    example: '(617) 555-1234',
    required: false,
  })
  @IsString()
  @IsOptional()
  'contact.phoneNumber'?: string;

  @ApiProperty({
    description: 'Emergency contact',
    example: '(617) 555-5678',
    required: false,
  })
  @IsString()
  @IsOptional()
  'contact.emergencyContact'?: string;

  @ApiProperty({
    description: 'Address type (e.g., Home, Work)',
    example: 'Home',
    required: false,
  })
  @IsOptional()
  @IsString()
  'contact.addressType'?: string;

  // Professional Info
  @ApiProperty({
    description: 'Department ID',
    example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    required: false,
  })
  @IsUUID(4)
  @IsOptional()
  'professional.departmentId'?: string;

  @ApiProperty({
    description: 'Position or title',
    example: 'Senior Mathematics Teacher',
    required: false,
  })
  @IsString()
  @IsOptional()
  'professional.position'?: string;

  @ApiProperty({
    description: 'Join date (YYYY-MM-DD format)',
    example: '2020-08-15',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsDateString()
  'professional.joinDate'?: string;

  @ApiProperty({
    enum: EmploymentType,
    enumName: 'EmploymentType',
    example: EmploymentType.FullTime,
    description: 'Type of employment',
    required: false,
  })
  @IsEnum(EmploymentType)
  @IsOptional()
  'professional.employmentType'?: EmploymentType;

  @ApiProperty({
    description: 'Educational qualifications',
    example: 'Ph.D. in Mathematics, Stanford University',
    required: false,
  })
  @IsString()
  @IsOptional()
  'professional.qualification'?: string;

  @ApiProperty({
    description: 'Years of teaching experience',
    example: '10 years of teaching at university level',
    required: false,
  })
  @IsString()
  @IsOptional()
  'professional.experience'?: string;

  @ApiProperty({
    description: 'Area of specialization',
    example: 'Applied Mathematics and Statistics',
    required: false,
  })
  @IsString()
  @IsOptional()
  'professional.specialization'?: string;
}
