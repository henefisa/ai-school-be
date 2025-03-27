import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Gender } from 'src/shared/constants';

export class UpdateStudentDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  lastName?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  username?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  password?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dob?: Date;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
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
