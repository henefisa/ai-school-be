import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  credits?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  required?: boolean;

  @IsOptional()
  @IsUUID(4)
  departmentId?: string;
}
