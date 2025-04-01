import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Gender, Title, EmploymentType } from 'src/shared/constants';

export class CreateTeacherDto {
  // Personal Info
  @ApiProperty({
    enum: Title,
    enumName: 'Title',
    example: Title.Mr,
    description: 'Teacher title',
  })
  @IsEnum(Title)
  @IsNotEmpty()
  'personal.title': Title;

  @ApiProperty({
    description: 'Employee ID',
    example: 'EMP2024001',
  })
  @IsString()
  @IsNotEmpty()
  'personal.employeeId': string;

  @ApiProperty({
    description: 'Teacher first name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  'personal.firstName': string;

  @ApiProperty({
    description: 'Teacher last name',
    example: 'Smith',
  })
  @IsString()
  @IsNotEmpty()
  'personal.lastName': string;

  @ApiProperty({
    description: 'Date of birth (YYYY-MM-DD format)',
    example: '1980-05-15',
  })
  @IsString()
  @IsNotEmpty()
  @IsDateString()
  'personal.dob': string;

  @ApiProperty({
    enum: Gender,
    enumName: 'Gender',
    example: Gender.Male,
  })
  @IsEnum(Gender)
  @IsNotEmpty()
  'personal.gender': Gender;

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
  })
  @IsString()
  @IsNotEmpty()
  'personal.username': string;

  @ApiProperty({
    description: 'Password for teacher account',
    example: 'Secure@Password123',
  })
  @IsString()
  @IsNotEmpty()
  'personal.password': string;

  // Contact Info
  @ApiProperty({
    description: 'Street address',
    example: '123 Main Street',
  })
  @IsString()
  @IsNotEmpty()
  'contact.street': string;

  @ApiProperty({
    description: 'City',
    example: 'Boston',
  })
  @IsString()
  @IsNotEmpty()
  'contact.city': string;

  @ApiProperty({
    description: 'State/Province',
    example: 'Massachusetts',
  })
  @IsString()
  @IsNotEmpty()
  'contact.state': string;

  @ApiProperty({
    description: 'Zip/Postal code',
    example: '02108',
  })
  @IsString()
  @IsNotEmpty()
  'contact.zipCode': string;

  @ApiProperty({
    description: 'Country',
    example: 'United States',
  })
  @IsString()
  @IsNotEmpty()
  'contact.country': string;

  @ApiProperty({
    description: 'Email address',
    example: 'john.smith@example.com',
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  'contact.email': string;

  @ApiProperty({
    description: 'Phone number',
    example: '(617) 555-1234',
  })
  @IsString()
  @IsNotEmpty()
  'contact.phoneNumber': string;

  @ApiProperty({
    description: 'Emergency contact',
    example: '(617) 555-5678',
  })
  @IsString()
  @IsNotEmpty()
  'contact.emergencyContact': string;

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
  })
  @IsUUID(4)
  @IsNotEmpty()
  'professional.departmentId': string;

  @ApiProperty({
    description: 'Position or title',
    example: 'Senior Mathematics Teacher',
  })
  @IsString()
  @IsNotEmpty()
  'professional.position': string;

  @ApiProperty({
    description: 'Join date (YYYY-MM-DD format)',
    example: '2020-08-15',
  })
  @IsString()
  @IsNotEmpty()
  @IsDateString()
  'professional.joinDate': string;

  @ApiProperty({
    enum: EmploymentType,
    enumName: 'EmploymentType',
    example: EmploymentType.FullTime,
    description: 'Type of employment',
  })
  @IsEnum(EmploymentType)
  @IsNotEmpty()
  'professional.employmentType': EmploymentType;

  @ApiProperty({
    description: 'Educational qualifications',
    example: 'Ph.D. in Mathematics, Stanford University',
  })
  @IsString()
  @IsNotEmpty()
  'professional.qualification': string;

  @ApiProperty({
    description: 'Years of teaching experience',
    example: '10 years of teaching at university level',
  })
  @IsString()
  @IsNotEmpty()
  'professional.experience': string;

  @ApiProperty({
    description: 'Area of specialization',
    example: 'Applied Mathematics and Statistics',
  })
  @IsString()
  @IsNotEmpty()
  'professional.specialization': string;
}
