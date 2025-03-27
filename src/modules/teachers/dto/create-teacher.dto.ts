import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Gender } from 'src/shared/constants';

export class CreateTeacherDto {
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
  @Type(() => Date)
  @IsDate()
  hireDate?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salary?: number;

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
  departmentId?: string;
}
