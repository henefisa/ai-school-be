import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Gender } from 'src/shared/constants';

export class PersonalInfoDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @Type(() => Date)
  dob: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsOptional()
  @IsString()
  studentId?: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  // The photo will be handled via multer and passed as a file
}

export class ContactInfoDto {
  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class AcademicInfoDto {
  @IsString()
  @IsNotEmpty()
  grade: string;

  @IsOptional()
  @IsString()
  enrollmentDate?: string;

  @IsOptional()
  @IsString()
  previousSchool?: string;

  @IsString()
  @IsNotEmpty()
  academicYear: string;

  @IsOptional()
  @IsString()
  additionalNotes?: string;
}

export class ParentInfoDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  relationship: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  emergencyContact: string;

  @IsUUID(4)
  @IsNotEmpty()
  parentId: string;
}

export class CreateStudentFormDto {
  @IsObject()
  @ValidateNested()
  @Type(() => PersonalInfoDto)
  personal: PersonalInfoDto;

  @IsObject()
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contact: ContactInfoDto;

  @IsObject()
  @ValidateNested()
  @Type(() => AcademicInfoDto)
  academic: AcademicInfoDto;

  @IsObject()
  @ValidateNested()
  @Type(() => ParentInfoDto)
  parent: ParentInfoDto;
}

// Keep the original DTO for backward compatibility
export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dob?: Date;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  contactNumber?: string;

  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUUID(4)
  parentId?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  enrollmentDate?: Date;
}
