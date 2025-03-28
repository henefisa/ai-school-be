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
import { Gender } from 'src/shared/constants';

export class CreateStudentDto {
  // Personal Info
  @ApiProperty({
    description: 'Student first name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  'personal.firstName': string;

  @ApiProperty({
    description: 'Student last name',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  'personal.lastName': string;

  @ApiProperty({
    description: 'Student date of birth (YYYY-MM-DD format)',
    example: '2000-01-01',
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
  'personal.gender': Gender;

  @ApiProperty({
    description: 'Student ID',
    required: false,
    example: 'ST2024001',
  })
  @IsOptional()
  @IsString()
  'personal.studentId'?: string;

  @ApiProperty({
    description: 'Username for student account',
    example: 'john.doe',
  })
  @IsString()
  @IsNotEmpty()
  'personal.username': string;

  @ApiProperty({
    description: 'Password for student account',
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
    example: 'john.doe@example.com',
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
  'contact.phone': string;

  // Academic Info
  @ApiProperty({
    description: 'Current grade level',
    example: '10',
  })
  @IsString()
  @IsNotEmpty()
  'academic.grade': string;

  @ApiProperty({
    description: 'Enrollment date (YYYY-MM-DD format)',
    required: false,
    example: '2023-09-01',
  })
  @IsOptional()
  @IsString()
  @IsDateString()
  'academic.enrollmentDate'?: string;

  @ApiProperty({
    description: 'Previous school',
    required: false,
    example: 'Springfield High School',
  })
  @IsOptional()
  @IsString()
  'academic.previousSchool'?: string;

  @ApiProperty({
    description: 'Academic year',
    example: '2023-2024',
  })
  @IsString()
  @IsNotEmpty()
  'academic.academicYear': string;

  @ApiProperty({
    description: 'Additional notes',
    required: false,
    example: 'Student has excelled in mathematics and science',
  })
  @IsOptional()
  @IsString()
  'academic.additionalNotes'?: string;

  // Parent Info
  @ApiProperty({
    description: 'Parent full name',
    example: 'James Doe',
  })
  @IsString()
  @IsNotEmpty()
  'parent.name': string;

  @ApiProperty({
    description: 'Relationship to student',
    example: 'Father',
  })
  @IsString()
  @IsNotEmpty()
  'parent.relationship': string;

  @ApiProperty({
    description: 'Parent email address',
    example: 'james.doe@example.com',
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  'parent.email': string;

  @ApiProperty({
    description: 'Parent phone number',
    example: '(617) 555-5678',
  })
  @IsString()
  @IsNotEmpty()
  'parent.phoneNumber': string;

  @ApiProperty({
    description: 'Parent address',
    example: '123 Main Street, Boston, MA 02108',
  })
  @IsString()
  @IsNotEmpty()
  'parent.address': string;

  @ApiProperty({
    description: 'Emergency contact information',
    example: 'Jane Doe (Mother): (617) 555-9012',
  })
  @IsString()
  @IsNotEmpty()
  'parent.emergencyContact': string;

  @ApiProperty({
    description: 'Parent ID in the system',
    example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  })
  @IsUUID(4)
  @IsNotEmpty()
  'parent.parentId': string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Student photo (jpg, png, or jpeg)',
  })
  @IsOptional()
  photo?: Express.Multer.File;
}
